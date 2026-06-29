import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json() as {
      type: "deposit" | "withdrawal";
      action: "approved" | "rejected";
      user_id: string;
      user_email: string;
      currency: string;
      amount: number;
      usd_value?: number;
      transaction_id: string;
      destination_address?: string;
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const appUrl   = Deno.env.get("APP_URL") ?? "https://btcminer.online";
    const approved = payload.action === "approved";
    const isDeposit = payload.type === "deposit";
    const typeLabel   = isDeposit ? "Deposit" : "Withdrawal";
    const statusLabel = approved ? "Approved" : "Rejected";
    const statusEmoji = approved ? "✅" : "❌";
    const amountStr   = `${payload.amount} ${payload.currency}${payload.usd_value ? ` (~$${payload.usd_value.toLocaleString()})` : ""}`;

    let bodyText = "";
    if (isDeposit && approved) {
      bodyText = `Your deposit of ${amountStr} has been approved and credited to your wallet.`;
    } else if (isDeposit && !approved) {
      bodyText = `Your deposit request of ${amountStr} has been rejected. Please contact support if you have any questions.`;
    } else if (!isDeposit && approved) {
      bodyText = `Your withdrawal of ${amountStr}${payload.destination_address ? ` to ${payload.destination_address}` : ""} has been approved and is being processed.`;
    } else {
      bodyText = `Your withdrawal request of ${amountStr} has been rejected. Any reserved funds have been returned to your balance. Please contact support if you have questions.`;
    }

    // ── In-app notification ───────────────────────────────────────────────
    await supabase.from("notifications").insert({
      user_id: payload.user_id,
      title:   `${typeLabel} ${statusLabel} ${statusEmoji}`,
      message: bodyText,
      type:    approved ? "success" : "error",
      read:    false,
    });

    // ── Email via Resend ──────────────────────────────────────────────────
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("[notify-user] RESEND_API_KEY not set — email skipped, in-app notification sent.");
    } else if (!payload.user_email) {
      console.warn("[notify-user] No user_email in payload — email skipped.");
    } else {
      const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@btcminer.online";
      const accentColor = approved ? "#22c55e" : "#ef4444";
      const ctaHref  = `${appUrl}/dashboard/transactions`;

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
          <p style="margin:4px 0 0;color:#000;font-size:13px;opacity:0.7;">Transaction Notification</p>
        </td>
      </tr>
      <!-- Status badge -->
      <tr>
        <td style="padding:28px 28px 0;">
          <span style="display:inline-block;background:${accentColor}22;color:${accentColor};border:1px solid ${accentColor}44;border-radius:6px;padding:4px 14px;font-size:13px;font-weight:600;">
            ${typeLabel} ${statusLabel} ${statusEmoji}
          </span>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:16px 28px 24px;color:#d1d5db;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;">${bodyText}</p>
        </td>
      </tr>
      <!-- Details -->
      <tr>
        <td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:8px;overflow:hidden;">
            <tr style="border-bottom:1px solid #374151;">
              <td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Amount</td>
              <td style="padding:10px 16px;color:#fff;font-size:13px;font-family:monospace;text-align:right;">${amountStr}</td>
            </tr>
            <tr style="border-bottom:1px solid #374151;">
              <td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Type</td>
              <td style="padding:10px 16px;color:#fff;font-size:13px;text-align:right;">${typeLabel}</td>
            </tr>
            ${payload.destination_address ? `<tr style="border-bottom:1px solid #374151;"><td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Address</td><td style="padding:10px 16px;color:#fff;font-size:13px;font-family:monospace;text-align:right;word-break:break-all;">${payload.destination_address}</td></tr>` : ""}
            <tr>
              <td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Transaction ID</td>
              <td style="padding:10px 16px;color:#6b7280;font-size:12px;font-family:monospace;text-align:right;">${payload.transaction_id}</td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:0 28px 28px;" align="center">
          <a href="${ctaHref}" style="display:inline-block;background:#f7931a;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:8px;">
            View Transactions →
          </a>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;">
          <p style="margin:0;color:#4b5563;font-size:12px;">If you did not make this request, contact support immediately at ${appUrl}/dashboard/support</p>
          <p style="margin:6px 0 0;color:#374151;font-size:12px;">— The BTCMiner.online Team</p>
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
          from:    fromEmail,
          to:      payload.user_email,
          subject: `[BTCMiner] ${typeLabel} ${statusLabel} — ${payload.amount} ${payload.currency}`,
          html,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("[notify-user] Resend error:", emailRes.status, errText);
      } else {
        console.log("[notify-user] Email sent to", payload.user_email);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-user] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
