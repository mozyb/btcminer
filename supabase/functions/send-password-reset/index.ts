import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email } = await req.json() as { email: string };
    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const appUrl      = Deno.env.get("APP_URL") ?? "https://btcminer.online";
    const redirectTo  = `${appUrl}/reset-password`;

    // Generate a Supabase recovery link (cryptographically valid, expires in 1h)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkErr) {
      // Don't reveal whether the email exists — return success either way
      console.warn("[send-password-reset] generateLink error:", linkErr.message);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      console.error("[send-password-reset] No action_link in response");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch first name from profile for personalization
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, username")
      .eq("email", email)
      .maybeSingle();
    const firstName = profile?.first_name ?? profile?.username ?? email.split("@")[0];

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("[send-password-reset] RESEND_API_KEY not set — email skipped.");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@btcminer.online";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;">

      <!-- Header -->
      <tr>
        <td style="background:#f7931a;padding:20px 28px;">
          <p style="margin:0;color:#000;font-size:18px;font-weight:700;">BTCMiner.online</p>
          <p style="margin:4px 0 0;color:#000;font-size:13px;opacity:0.7;">Password Reset Request</p>
        </td>
      </tr>

      <!-- Icon -->
      <tr>
        <td align="center" style="padding:32px 28px 16px;">
          <div style="width:64px;height:64px;background:#f7931a1a;border:1px solid #f7931a33;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-size:30px;">🔑</span>
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:0 28px 8px;">
          <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:20px;font-weight:700;text-align:center;">Reset Your Password</h2>
          <p style="margin:0 0 8px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi <strong style="color:#f7931a;">${firstName}</strong>,</p>
          <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.6;">
            We received a request to reset your BTCMiner.online password. Click the button below to choose a new password. This link is valid for <strong style="color:#e2e8f0;">1 hour</strong>.
          </p>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td align="center" style="padding:0 28px 28px;">
          <a href="${actionLink}"
             style="display:inline-block;background:#f7931a;color:#000;font-weight:700;font-size:15px;text-decoration:none;padding:14px 40px;border-radius:8px;">
            Reset My Password →
          </a>
        </td>
      </tr>

      <!-- Security note -->
      <tr>
        <td style="padding:0 28px 28px;">
          <div style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:16px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Security Tips</p>
            ${[
              "If you did not request a password reset, ignore this email — your password will not change.",
              "Never share this link with anyone. BTCMiner support will never ask for it.",
              "After resetting, sign in from a trusted device only.",
            ].map(tip => `<p style="margin:0 0 6px;color:#475569;font-size:13px;line-height:1.5;">• ${tip}</p>`).join("")}
          </div>
        </td>
      </tr>

      <!-- Fallback link -->
      <tr>
        <td style="padding:0 28px 28px;">
          <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
            Button not working? Copy and paste this link into your browser:<br/>
            <span style="color:#64748b;word-break:break-all;font-size:11px;">${actionLink}</span>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;text-align:center;">
          <p style="margin:0;color:#334155;font-size:12px;">
            © ${new Date().getFullYear()} BTCMiner.online ·
            <a href="${appUrl}/dashboard/support" style="color:#4b5563;text-decoration:none;">Contact Support</a>
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
        to:      email,
        subject: "[BTCMiner] Reset your password",
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("[send-password-reset] Resend error:", emailRes.status, errText);
    } else {
      console.log("[send-password-reset] Email sent to", email);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-password-reset] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
