import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderTemplate(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, user_id } = await req.json() as { token: string; user_id: string };

    if (!token || !user_id) {
      return new Response(JSON.stringify({ error: "token and user_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Hash the submitted token for comparison
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Lookup token record
    const { data: record, error: fetchErr } = await supabase
      .from("email_verification_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .eq("user_id", user_id)
      .maybeSingle();

    if (fetchErr || !record) {
      return new Response(JSON.stringify({ error: "Invalid or expired verification link." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (record.used_at) {
      return new Response(JSON.stringify({ error: "This verification link has already been used." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(record.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This verification link has expired. Please request a new one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark token as used
    await supabase
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    // Mark user as verified
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", user_id);

    if (profileErr) {
      console.error("[verify-email-token] profile update error:", profileErr);
      return new Response(JSON.stringify({ error: "Failed to verify email. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Attach welcome discount automatically ───────────────────────────
    let welcomePromoId: string | null = null;
    let welcomeDiscountValue = 0;
    try {
      const { data: promo } = await supabase
        .from("promotions")
        .select("id, promo_type, discount_value, end_date")
        .eq("coupon_code", "WELCOME10")
        .eq("is_active", true)
        .maybeSingle();

      if (promo && (!promo.end_date || new Date(promo.end_date) > new Date())) {
        const { count } = await supabase
          .from("promotion_redemptions")
          .select("*", { count: "exact", head: true })
          .eq("promotion_id", promo.id)
          .eq("user_id", user_id);

        if ((count ?? 0) === 0) {
          const { error: redemptionErr } = await supabase
            .from("promotion_redemptions")
            .insert({
              promotion_id: promo.id,
              user_id,
              contract_id: null,
              discount_usd: 0,
            });
          if (!redemptionErr) {
            await supabase.rpc("increment_promotion_redemption", { promo_id: promo.id });
            welcomePromoId = promo.id;
            welcomeDiscountValue = promo.discount_value ?? 0;
          } else {
            console.error("[verify-email-token] redemption error:", redemptionErr);
          }
        }
      }
    } catch (promoErr) {
      console.error("[verify-email-token] welcome discount error:", promoErr);
    }

    // ── Link email lead to user and update funnel ──────────────────────────
    try {
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", user_id).single();
      if (profile?.email) {
        await supabase.from("email_leads")
          .update({ user_id, status: "converted", opted_in: true, opted_in_at: new Date().toISOString() })
          .eq("email", profile.email.toLowerCase());
        await supabase.from("funnel_events").insert({
          event: "registered", user_id, email: profile.email,
          metadata: { source: "popup", welcome_promo_id: welcomePromoId },
        });
      }
    } catch (err) {
      console.warn("[verify-email-token] lead/funnel update error:", err);
    }

    // ── Send welcome email after successful verification ─────────────────
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("email, first_name")
        .eq("id", user_id)
        .maybeSingle();

      if (profileRow?.email) {
        // Try to use the welcome template, fallback to legacy inline HTML
        const { data: template } = await supabase
          .from("email_templates")
          .select("subject, html_body, text_body")
          .eq("slug", "welcome_lead")
          .eq("is_active", true)
          .maybeSingle();

        const appUrl = Deno.env.get("APP_URL") ?? "https://btcminer.online";
        const name = profileRow.first_name || profileRow.email.split("@")[0];

        if (template) {
          const vars: Record<string, string | number | undefined> = {
            first_name: name,
            email: profileRow.email,
            dashboard_link: `${appUrl}/dashboard`,
            support_email: Deno.env.get("SUPPORT_EMAIL") ?? "support@btcminer.online",
            unsubscribe_link: `${appUrl}/unsubscribe?user_id=${encodeURIComponent(user_id)}`,
            welcome_discount: welcomeDiscountValue ? `${welcomeDiscountValue}%` : "",
          };
          const html = renderTemplate(template.html_body, vars);
          const text = renderTemplate(template.text_body ?? "", vars);

          const { data: cfgRow } = await supabase
            .from("email_settings")
            .select("value")
            .eq("key", "resend_config")
            .maybeSingle();
          const cfg = (cfgRow?.value ?? {}) as Record<string, unknown>;
          const resendKey = (cfg.api_key as string) || Deno.env.get("RESEND_API_KEY") || "";
          const fromEmail = (cfg.from_email as string) || Deno.env.get("FROM_EMAIL") || "noreply@btcminer.online";
          const fromName = (cfg.from_name as string) || "BTCMiner.online";
          const enabled = cfg.enabled !== false && cfg.enabled !== "false";

          if (enabled && resendKey) {
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: profileRow.email,
                subject: renderTemplate(template.subject, vars),
                html,
                text,
              }),
            });
            const resBody = await emailRes.json().catch(() => ({}));
            await supabase.from("email_logs").insert({
              to_email: profileRow.email,
              subject: renderTemplate(template.subject, vars),
              template_slug: "welcome_lead",
              provider_name: "resend",
              delivery_status: emailRes.ok ? "delivered" : "failed",
              error_message: emailRes.ok ? null : JSON.stringify(resBody),
              message_id: emailRes.ok ? (resBody as Record<string, string>).id ?? null : null,
              metadata: { user_id, welcome_promo_id: welcomePromoId },
            }).catch(() => {});
          }
        } else {
          // Legacy inline welcome email
          const { data: cfgRow } = await supabase
            .from("email_settings")
            .select("value")
            .eq("key", "resend_config")
            .maybeSingle();
          const cfg = (cfgRow?.value ?? {}) as Record<string, unknown>;
          const resendKey = (cfg.api_key as string) || Deno.env.get("RESEND_API_KEY") || "";
          const fromEmail = (cfg.from_email as string) || "noreply@btcminer.online";
          const fromName = (cfg.from_name as string) || "BTCMiner.online";
          const enabled = cfg.enabled !== false && cfg.enabled !== "false";
          const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;">
          <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Welcome to BTCMiner.online!</h1>
          <p style="margin:8px 0 0;color:#64748b;font-size:14px;">Your email is verified — you're ready to mine</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px 24px;">
          <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi <strong style="color:#f7931a;">${name}</strong>,</p>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Your email has been verified. Your account is fully active and your ${welcomeDiscountValue}% welcome discount is ready to use on your first eligible mining contract.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">
                Go to Dashboard
              </a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;">
          <p style="margin:0;color:#334155;font-size:12px;text-align:center;line-height:1.6;">© ${new Date().getFullYear()} BTCMiner.online</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

          if (enabled && resendKey) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: profileRow.email,
                subject: "Welcome to BTCMiner.online — your account is verified!",
                html,
              }),
            });
          }
        }
      }
    } catch (welcomeErr) {
      console.warn("[verify-email-token] Welcome email error (non-fatal):", welcomeErr);
    }

    return new Response(JSON.stringify({ ok: true, verified: true, welcome_promo_id: welcomePromoId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-email-token] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
