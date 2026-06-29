import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json() as {
      type: "deposit" | "withdrawal";
      user_id: string;
      user_email: string;
      currency: string;
      amount: number;
      usd_value?: number;
      transaction_id: string;
      destination_address?: string;
    };

    // Fetch admin email from platform_settings
    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "admin_email")
      .maybeSingle();

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || setting?.value || "admin@btcminer.online";
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const isDeposit = body.type === "deposit";
    const subject = isDeposit
      ? `[BTCMiner] New Manual Deposit Request — ${body.amount} ${body.currency}`
      : `[BTCMiner] New Withdrawal Request — ${body.amount} ${body.currency}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
  .header { background: #f7931a; padding: 24px; }
  .header h1 { color: #000; margin: 0; font-size: 20px; font-weight: 700; }
  .header p { color: #000; margin: 4px 0 0; font-size: 13px; opacity: 0.7; }
  .body { padding: 24px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
  .badge-deposit { background: #16a34a22; color: #4ade80; border: 1px solid #16a34a44; }
  .badge-withdrawal { background: #dc262622; color: #f87171; border: 1px solid #dc262644; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a2a2a; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .label { color: #888; }
  .value { color: #fff; font-weight: 500; font-family: monospace; }
  .cta { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #f7931a; color: #000; font-weight: 700; text-decoration: none; border-radius: 6px; font-size: 14px; }
  .footer { padding: 16px 24px; background: #111; font-size: 12px; color: #555; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>BTCMiner.online — Admin Alert</h1>
    <p>Manual ${body.type} requires your approval</p>
  </div>
  <div class="body">
    <span class="badge badge-${body.type}">${body.type.toUpperCase()}</span>
    <div>
      <div class="row"><span class="label">User</span><span class="value">${body.user_email}</span></div>
      <div class="row"><span class="label">Amount</span><span class="value">${body.amount} ${body.currency}</span></div>
      ${body.usd_value ? `<div class="row"><span class="label">USD Value</span><span class="value">~$${body.usd_value.toLocaleString()}</span></div>` : ""}
      ${body.destination_address ? `<div class="row"><span class="label">Send To</span><span class="value">${body.destination_address}</span></div>` : ""}
      <div class="row"><span class="label">Transaction ID</span><span class="value">${body.transaction_id}</span></div>
      <div class="row"><span class="label">Submitted At</span><span class="value">${new Date().toUTCString()}</span></div>
    </div>
    <a class="cta" href="${Deno.env.get("APP_URL") ?? "https://btcminer.online"}${isDeposit ? "/admin/deposits" : "/admin/withdrawals"}">
      Review in Admin Panel →
    </a>
  </div>
  <div class="footer">This is an automated notification from BTCMiner.online. Do not reply.</div>
</div>
</body>
</html>`;

    // Send email via Resend if API key is configured
    if (resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BTCMiner Admin <noreply@btcminer.online>",
          to: [adminEmail],
          subject,
          html,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Resend error:", errText);
      }
    } else {
      // Fallback: log to console (visible in edge function logs)
      console.log(`[notify-admin] ${subject} | user=${body.user_email} amount=${body.amount} ${body.currency}`);
    }

    // Always create an in-app notification for all admins
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map((a) => ({
        user_id: a.id,
        title: isDeposit ? `New deposit request: ${body.amount} ${body.currency}` : `New withdrawal request: ${body.amount} ${body.currency}`,
        message: isDeposit
          ? `User ${body.user_email} submitted a manual deposit of ${body.amount} ${body.currency}. Awaiting your approval.`
          : `User ${body.user_email} requested withdrawal of ${body.amount} ${body.currency}${body.destination_address ? ` to ${body.destination_address}` : ""}. Awaiting your approval.`,
        type: "payment",
        read: false,
      }));
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-admin error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
