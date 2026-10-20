import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_email, first_name } = await req.json() as {
      user_id?: string;
      user_email: string;
      first_name?: string;
    };

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("[send-welcome-email] RESEND_API_KEY not set — skipping email.");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@btcminer.online";
    const appUrl    = Deno.env.get("APP_URL") ?? "https://btcminer.online";
    const name      = first_name ?? user_email.split("@")[0];

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:580px;">

      <!-- Header -->
      <tr>
        <td align="center" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 32px 32px;">
          <div style="width:56px;height:56px;background:#f7931a;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <span style="font-size:28px;">⚡</span>
          </div>
          <h1 style="margin:0;color:#f7931a;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Welcome to BTCMiner.online</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:15px;">Your cloud mining journey starts now</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;color:#e2e8f0;font-size:16px;line-height:1.6;">Hi <strong style="color:#f7931a;">${name}</strong>,</p>
          <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Welcome aboard! Your account has been created. Please click the verification link we just sent you to activate your account — then you'll have full access to your mining dashboard.
          </p>

          <!-- Feature highlights -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${[
              ["⚡", "Cloud Mining", "Mine Bitcoin with institutional-grade hardware — no equipment needed."],
              ["📈", "Live Dashboard", "Track earnings, hashrate, and network stats in real time."],
              ["💰", "Daily Payouts", "Automatic BTC rewards credited to your wallet every day."],
              ["🔒", "Secure & Transparent", "Enterprise security with full audit trail of all transactions."],
            ].map(([icon, title, desc]) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1f2937;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding-top:2px;font-size:20px;">${icon}</td>
                    <td>
                      <p style="margin:0;color:#f1f5f9;font-size:14px;font-weight:600;">${title}</p>
                      <p style="margin:2px 0 0;color:#64748b;font-size:13px;">${desc}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`).join("")}
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${appUrl}/dashboard"
                   style="display:inline-block;background:#f7931a;color:#000;font-weight:700;font-size:15px;text-decoration:none;padding:14px 40px;border-radius:8px;margin-top:8px;">
                  Go to My Dashboard →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;color:#475569;font-size:13px;text-align:center;">
            Questions? Visit our <a href="${appUrl}/faq" style="color:#f7931a;text-decoration:none;">FAQ</a> or
            <a href="${appUrl}/dashboard/support" style="color:#f7931a;text-decoration:none;">contact support</a>.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 32px;background:#0f172a;border-top:1px solid #1f2937;text-align:center;">
          <p style="margin:0;color:#334155;font-size:12px;">
            © ${new Date().getFullYear()} BTCMiner.online · You're receiving this because you registered an account.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        from:    `BTCMiner.online <${fromEmail}>`,
        to:      user_email,
        subject: "Welcome to BTCMiner.online — Start Mining Bitcoin Today ⚡",
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("[send-welcome-email] Resend error:", emailRes.status, errText);
    } else {
      console.log("[send-welcome-email] Sent to", user_email);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-welcome-email] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
