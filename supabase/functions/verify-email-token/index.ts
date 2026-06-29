import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const hashBuf  = await crypto.subtle.digest("SHA-256", encoder.encode(token));
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
    console.log("[verify-email-token] Verified user", user_id);

    // ── Send welcome email after successful verification ─────────────────
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("email, first_name")
        .eq("id", user_id)
        .maybeSingle();

      if (profileRow?.email) {
        const { data: cfgRow } = await supabase
          .from("email_settings")
          .select("value")
          .eq("key", "resend_config")
          .maybeSingle();

        const cfg = (cfgRow?.value ?? {}) as Record<string, unknown>;
        const resendKey = (cfg.api_key as string) || Deno.env.get("RESEND_API_KEY") || "";
        const fromEmail = (cfg.from_email as string) || "noreply@btcminer.online";
        const fromName  = (cfg.from_name  as string) || "BTCMiner.online";
        const enabled   = cfg.enabled !== false && cfg.enabled !== "false";
        const appUrl    = Deno.env.get("APP_URL") ?? "https://btcminer.online";
        const name      = profileRow.first_name || profileRow.email.split("@")[0];

        if (enabled && resendKey) {
          const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
            <tr>
              <td style="background:#f7931a;border-radius:10px;width:48px;height:48px;text-align:center;vertical-align:middle;"><span style="font-size:24px;line-height:1;">⚡</span></td>
              <td style="padding-left:12px;vertical-align:middle;"><span style="color:#f7931a;font-size:22px;font-weight:700;">BTC<span style="color:#ffffff;">Miner</span>.online</span></td>
            </tr>
          </table>
          <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Welcome to BTCMiner.online! 🎉</h1>
          <p style="margin:8px 0 0;color:#64748b;font-size:14px;">Your email is verified — you're ready to mine</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px 24px;">
          <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi <strong style="color:#f7931a;">${name}</strong>,</p>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Your email address has been verified. Your BTCMiner.online account is now fully active and you can start purchasing Bitcoin mining hashrate and earning real BTC rewards.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">
                Go to Dashboard →
              </a>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["⚡", "Buy Hashrate", "Choose from flexible mining contracts starting from any budget."],
              ["📊", "Live Dashboard", "Monitor your real-time mining performance and earnings 24/7."],
              ["₿", "Earn Bitcoin", "Automated daily BTC payouts sent directly to your wallet."],
            ].map(([icon, title, desc]) => `
            <tr>
              <td style="padding:0 0 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:8px;padding:0;">
                  <tr>
                    <td style="padding:14px 16px;width:40px;vertical-align:top;font-size:20px;">${icon}</td>
                    <td style="padding:14px 16px 14px 0;vertical-align:top;">
                      <p style="margin:0 0 4px;color:#e2e8f0;font-size:14px;font-weight:600;">${title}</p>
                      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">${desc}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;">
          <p style="margin:0;color:#334155;font-size:12px;text-align:center;line-height:1.6;">
            © ${new Date().getFullYear()} BTCMiner.online ·
            <a href="${appUrl}/dashboard/support" style="color:#4b5563;text-decoration:none;">Support</a> ·
            <a href="${appUrl}/privacy" style="color:#4b5563;text-decoration:none;">Privacy Policy</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: profileRow.email,
              subject: "Welcome to BTCMiner.online — your account is verified! 🎉",
              html,
            }),
          });

          const resBody = await emailRes.json().catch(() => ({}));
          await supabase.from("email_logs").insert({
            to_email: profileRow.email,
            subject: "Welcome to BTCMiner.online — your account is verified! 🎉",
            template_slug: "welcome",
            provider_name: "resend",
            delivery_status: emailRes.ok ? "delivered" : "failed",
            error_message: emailRes.ok ? null : JSON.stringify(resBody),
            message_id: emailRes.ok ? (resBody as Record<string,string>).id ?? null : null,
            metadata: { user_id },
          }).catch(() => {});

          console.log("[verify-email-token] Welcome email sent to", profileRow.email, emailRes.ok ? "OK" : `FAIL ${emailRes.status}`);
        }
      }
    } catch (welcomeErr) {
      // Non-fatal — verification already succeeded
      console.warn("[verify-email-token] Welcome email error (non-fatal):", welcomeErr);
    }

    return new Response(JSON.stringify({ ok: true, verified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-email-token] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
