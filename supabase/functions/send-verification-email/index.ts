import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, email, first_name } = await req.json() as {
      user_id: string;
      email: string;
      first_name?: string;
    };

    if (!user_id || !email) {
      return new Response(JSON.stringify({ error: "user_id and email are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── Load Resend config from DB ──────────────────────────────────────────
    const { data: configRow } = await supabase
      .from("email_settings")
      .select("value")
      .eq("key", "resend_config")
      .maybeSingle();

    const { data: enabledRow } = await supabase
      .from("email_settings")
      .select("value")
      .eq("key", "email_enabled")
      .maybeSingle();

    const cfg = (configRow?.value ?? {}) as Record<string, unknown>;
    const enabled = enabledRow?.value !== false && enabledRow?.value !== "false";

    // Prefer DB api_key, fall back to env var for backwards compat
    const resendKey = (cfg.api_key as string) || Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = (cfg.from_email as string) || Deno.env.get("FROM_EMAIL") || "noreply@btcminer.online";
    const fromName  = (cfg.from_name as string)  || "BTCMiner.online";

    // ── Generate cryptographically secure token ────────────────────────────
    const rawToken = crypto.randomUUID() + "-" + crypto.randomUUID();

    // Hash with SHA-256 before storing
    const encoder = new TextEncoder();
    const hashBuf  = await crypto.subtle.digest("SHA-256", encoder.encode(rawToken));
    const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Invalidate previous unused tokens for this user
    await supabase
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", user_id)
      .is("used_at", null);

    // Store new token
    const { error: tokenErr } = await supabase.from("email_verification_tokens").insert({
      user_id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    if (tokenErr) {
      console.error("[send-verification-email] token insert error:", tokenErr);
      return new Response(JSON.stringify({ error: "Failed to create token" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appUrl = Deno.env.get("APP_URL") ?? "https://btcminer.online";
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}&uid=${encodeURIComponent(user_id)}`;
    const name = first_name ?? email.split("@")[0];

    if (!enabled || !resendKey) {
      console.warn("[send-verification-email] Email disabled or no API key — token created, email skipped.");
      return new Response(JSON.stringify({ ok: true, skipped: true, verify_url: verifyUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Build HTML email ──────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
            <tr>
              <td style="background:#f7931a;border-radius:10px;width:48px;height:48px;text-align:center;vertical-align:middle;">
                <span style="font-size:24px;line-height:1;">⚡</span>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <span style="color:#f7931a;font-size:22px;font-weight:700;letter-spacing:-0.5px;">BTC<span style="color:#ffffff;">Miner</span>.online</span>
              </td>
            </tr>
          </table>
          <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Verify Your Email Address</h1>
          <p style="margin:8px 0 0;color:#64748b;font-size:14px;">One click to activate your mining account</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px 28px 24px;">
          <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Hi <strong style="color:#f7931a;">${name}</strong>,
          </p>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Thanks for creating your BTCMiner.online account. Please verify your email address to unlock full dashboard access and start earning Bitcoin mining rewards.
          </p>

          <!-- CTA button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td align="center">
                <a href="${verifyUrl}"
                   style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;letter-spacing:0.2px;">
                  ✓ Verify My Email
                </a>
              </td>
            </tr>
          </table>

          <!-- Info cards -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#1f2937;border-radius:8px;padding:16px;border-left:3px solid #f7931a;">
                <p style="margin:0 0 6px;color:#e2e8f0;font-size:13px;font-weight:600;">⏱ Link expires in 24 hours</p>
                <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">After expiry, request a new verification email from the sign-in page.</p>
              </td>
            </tr>
          </table>

          <!-- Security notice -->
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 8px;color:#475569;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">🔒 Security Notice</p>
            <p style="margin:0 0 6px;color:#475569;font-size:13px;line-height:1.5;">• If you didn't create this account, you can safely ignore this email.</p>
            <p style="margin:0 0 6px;color:#475569;font-size:13px;line-height:1.5;">• Never share this link with anyone — it grants access to your account.</p>
            <p style="margin:0;color:#475569;font-size:13px;line-height:1.5;">• BTCMiner support will never ask you for this link.</p>
          </div>

          <!-- Fallback URL -->
          <p style="margin:0;color:#475569;font-size:12px;text-align:center;line-height:1.6;">
            Button not working? Copy and paste this URL into your browser:<br/>
            <a href="${verifyUrl}" style="color:#3b82f6;word-break:break-all;font-size:11px;">${verifyUrl}</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
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

    // ── Send via Resend ───────────────────────────────────────────────────
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject: "Verify your BTCMiner.online email address ✓",
        html,
      }),
    });

    const resBody = await emailRes.json().catch(() => ({}));
    const success = emailRes.ok;

    // Log to email_logs
    await supabase.from("email_logs").insert({
      to_email: email,
      subject: "Verify your BTCMiner.online email address ✓",
      template_slug: "verify-email",
      provider_name: "resend",
      delivery_status: success ? "delivered" : "failed",
      error_message: success ? null : JSON.stringify(resBody),
      message_id: success ? (resBody as Record<string, string>).id ?? null : null,
      metadata: { user_id },
    }).catch(() => {/* non-blocking */});

    if (!success) {
      console.error("[send-verification-email] Resend error:", emailRes.status, JSON.stringify(resBody));
      // Token was already created — always return 200 so the client can show
      // the "check your inbox" page and offer the resend button.
      return new Response(JSON.stringify({ ok: true, email_skipped: true, reason: JSON.stringify(resBody) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[send-verification-email] Sent to", email);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-verification-email] fatal:", err);
    // Return 200 with error info so the client UX is not broken — the token was
    // likely already persisted and the user can resend from the verify-email page.
    return new Response(JSON.stringify({ ok: true, email_skipped: true, reason: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
