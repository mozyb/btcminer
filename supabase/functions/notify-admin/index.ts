import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function adminEmail(opts: {
  badgeColor: string;
  badgeLabel: string;
  title: string;
  rows: [string, string][];
  ctaHref: string;
  ctaLabel: string;
}) {
  const rowsHtml = opts.rows.map(([k, v]) => `
    <tr style="border-bottom:1px solid #2a2a2a;">
      <td style="padding:10px 16px;color:#888;font-size:13px;white-space:nowrap;">${k}</td>
      <td style="padding:10px 16px;color:#fff;font-size:13px;font-family:monospace;text-align:right;word-break:break-all;">${v}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#0a0a0a;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;overflow:hidden;border:1px solid #2a2a2a;max-width:580px;">
  <tr><td style="background:#f7931a;padding:20px 28px;">
    <p style="margin:0;color:#000;font-size:18px;font-weight:700;">BTCMiner.online — Admin Alert</p>
    <p style="margin:4px 0 0;color:#000;font-size:13px;opacity:0.7;">${opts.title}</p>
  </td></tr>
  <tr><td style="padding:20px 28px 8px;">
    <span style="display:inline-block;background:${opts.badgeColor}22;color:${opts.badgeColor};border:1px solid ${opts.badgeColor}55;border-radius:5px;padding:4px 14px;font-size:12px;font-weight:600;">${opts.badgeLabel}</span>
  </td></tr>
  <tr><td style="padding:8px 28px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;">${rowsHtml}</table>
  </td></tr>
  <tr><td style="padding:0 28px 24px;" align="center">
    <a href="${opts.ctaHref}" style="display:inline-block;background:#f7931a;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">${opts.ctaLabel} →</a>
  </td></tr>
  <tr><td style="padding:14px 28px;background:#111;border-top:1px solid #2a2a2a;">
    <p style="margin:0;color:#555;font-size:12px;">Automated alert — BTCMiner.online Admin Panel</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// Send via email-send function (handles DB logging)
async function dispatchEmail(supabase: ReturnType<typeof createClient>, opts: {
  to_email: string;
  subject: string;
  html_body: string;
  template_slug: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.functions.invoke("email-send", {
    body: {
      to_email:      opts.to_email,
      subject:       opts.subject,
      html_body:     opts.html_body,
      template_slug: opts.template_slug,
      priority:      1, // Admin emails get highest priority
      metadata:      opts.metadata ?? {},
    },
  });
  if (error) {
    console.error("[notify-admin] email-send invoke error:", error);
    return false;
  }
  const result = data as { delivery_status?: string; error?: string } | null;
  if (result?.error) {
    console.error("[notify-admin] email-send returned error:", result.error);
    return false;
  }
  console.log("[notify-admin] email dispatched:", result?.delivery_status ?? "queued");
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const eventType: string = body.type ?? "generic";
    const appUrl = Deno.env.get("APP_URL") ?? "https://btcminer.online";

    // Resolve admin email: env var → platform_settings → fallback
    const adminEmailEnv = Deno.env.get("ADMIN_EMAIL") ?? "";
    let adminEmailAddr = adminEmailEnv;
    if (!adminEmailAddr) {
      const { data: setting } = await supabase
        .from("platform_settings").select("value").eq("key", "admin_email").maybeSingle();
      adminEmailAddr = setting?.value ?? "admin@btcminer.online";
    }

    let subject = "";
    let html    = "";

    const userEmail = String(body.user_email ?? "—");
    const userId    = String(body.user_id    ?? "—");

    switch (eventType) {
      case "user_registered": {
        subject = `[Admin] New User Registration — BTCMiner.online`;
        html = adminEmail({
          badgeColor: "#22c55e", badgeLabel: "New Registration",
          title: "A new user has registered",
          rows: [
            ["User Email", userEmail],
            ["User ID",    userId],
            ["Registered", new Date().toUTCString()],
          ],
          ctaHref: `${appUrl}/admin/users`, ctaLabel: "View Users",
        });
        break;
      }

      case "deposit":
      case "deposit_created": {
        subject = `[Admin] New Deposit — ${body.amount ?? ""} ${body.currency ?? "BTC"}`;
        html = adminEmail({
          badgeColor: "#f7931a", badgeLabel: "New Deposit",
          title: "A deposit request has been submitted",
          rows: [
            ["User",    userEmail],
            ["Amount",  `${body.amount ?? "—"} ${body.currency ?? "BTC"}`],
            ["Network", String(body.network ?? body.currency ?? "—")],
            ["USD",     `$${body.usd_value ?? "—"}`],
            ["Tx ID",   String(body.transaction_id ?? "—")],
            ["Address", String(body.wallet_address ?? "—")],
          ],
          ctaHref: `${appUrl}/admin/deposits`, ctaLabel: "Review Deposits",
        });
        break;
      }

      case "deposit_confirmed": {
        subject = `[Admin] Deposit Confirmed — ${body.amount ?? ""} ${body.currency ?? "BTC"}`;
        html = adminEmail({
          badgeColor: "#22c55e", badgeLabel: "Deposit Confirmed",
          title: "Deposit confirmed and credited",
          rows: [
            ["User",   userEmail],
            ["Amount", `${body.amount ?? "—"} ${body.currency ?? "BTC"}`],
            ["Status", "Confirmed"],
          ],
          ctaHref: `${appUrl}/admin/deposits`, ctaLabel: "View Deposits",
        });
        break;
      }

      case "withdrawal_requested": {
        subject = `[Admin] Withdrawal Request — ${body.amount ?? ""} ${body.currency ?? "BTC"}`;
        html = adminEmail({
          badgeColor: "#ef4444", badgeLabel: "Withdrawal Requested",
          title: "A withdrawal is awaiting approval",
          rows: [
            ["User",    userEmail],
            ["Amount",  `${body.amount ?? "—"} ${body.currency ?? "BTC"}`],
            ["USD",     `$${body.usd_value ?? "—"}`],
            ["Address", String(body.destination_address ?? "—")],
            ["Tx ID",   String(body.transaction_id ?? "—")],
          ],
          ctaHref: `${appUrl}/admin/withdrawals`, ctaLabel: "Review Withdrawals",
        });
        break;
      }

      case "withdrawal_approved": {
        subject = `[Admin] Withdrawal Approved — ${body.amount ?? ""} ${body.currency ?? "BTC"}`;
        html = adminEmail({
          badgeColor: "#22c55e", badgeLabel: "Withdrawal Approved",
          title: "Withdrawal approved by admin",
          rows: [
            ["User",   userEmail],
            ["Amount", `${body.amount ?? "—"} ${body.currency ?? "BTC"}`],
          ],
          ctaHref: `${appUrl}/admin/withdrawals`, ctaLabel: "View Withdrawals",
        });
        break;
      }

      case "withdrawal_completed": {
        subject = `[Admin] Withdrawal Completed — Funds Sent`;
        html = adminEmail({
          badgeColor: "#22c55e", badgeLabel: "Withdrawal Completed",
          title: "Withdrawal has been sent",
          rows: [
            ["User",    userEmail],
            ["Amount",  `${body.amount ?? "—"} ${body.currency ?? "BTC"}`],
            ["TxHash",  String(body.tx_hash ?? "—")],
          ],
          ctaHref: `${appUrl}/admin/withdrawals`, ctaLabel: "View Withdrawals",
        });
        break;
      }

      case "contract_purchased": {
        subject = `[Admin] Contract Purchase — ${body.contract_name ?? "Contract"}`;
        html = adminEmail({
          badgeColor: "#f7931a", badgeLabel: "Contract Purchased",
          title: "A new mining contract was purchased",
          rows: [
            ["User",      userEmail],
            ["Contract",  String(body.contract_name ?? "—")],
            ["Hashrate",  String(body.hashrate       ?? "—")],
            ["Duration",  String(body.duration       ?? "—")],
            ["Amount",    `$${body.amount ?? "—"}`],
          ],
          ctaHref: `${appUrl}/admin/contracts`, ctaLabel: "View Contracts",
        });
        break;
      }

      case "kyc_submitted": {
        subject = `[Admin] KYC Submitted — Review Required`;
        html = adminEmail({
          badgeColor: "#3b82f6", badgeLabel: "KYC Submitted",
          title: "A user has submitted KYC documents",
          rows: [
            ["User",   userEmail],
            ["Status", "Pending Review"],
          ],
          ctaHref: `${appUrl}/admin/kyc`, ctaLabel: "Review KYC",
        });
        break;
      }

      case "kyc_approved": {
        subject = `[Admin] KYC Approved for ${userEmail}`;
        html = adminEmail({
          badgeColor: "#22c55e", badgeLabel: "KYC Approved",
          title: "KYC approved",
          rows: [["User", userEmail], ["Status", "Approved"]],
          ctaHref: `${appUrl}/admin/kyc`, ctaLabel: "View KYC",
        });
        break;
      }

      case "kyc_rejected": {
        subject = `[Admin] KYC Rejected for ${userEmail}`;
        html = adminEmail({
          badgeColor: "#ef4444", badgeLabel: "KYC Rejected",
          title: "KYC documents rejected",
          rows: [["User", userEmail], ["Reason", String(body.reason ?? "—")]],
          ctaHref: `${appUrl}/admin/kyc`, ctaLabel: "View KYC",
        });
        break;
      }

      case "support_ticket": {
        subject = `[Admin] New Support Ticket — ${body.subject ?? ""}`;
        html = adminEmail({
          badgeColor: "#3b82f6", badgeLabel: "Support Ticket",
          title: "A new support ticket has been submitted",
          rows: [
            ["User",     userEmail],
            ["Subject",  String(body.subject   ?? "—")],
            ["Priority", String(body.priority  ?? "Normal")],
            ["Ticket #", String(body.ticket_id ?? "—")],
          ],
          ctaHref: `${appUrl}/admin/support`, ctaLabel: "View Ticket",
        });
        break;
      }

      case "large_withdrawal": {
        subject = `[Admin] LARGE Withdrawal Alert — ${body.amount ?? ""} ${body.currency ?? "BTC"}`;
        html = adminEmail({
          badgeColor: "#ef4444", badgeLabel: "LARGE WITHDRAWAL",
          title: "Large withdrawal requires immediate review",
          rows: [
            ["User",    userEmail],
            ["Amount",  `${body.amount ?? "—"} ${body.currency ?? "BTC"}`],
            ["USD",     `$${body.usd_value ?? "—"}`],
            ["Address", String(body.destination_address ?? "—")],
          ],
          ctaHref: `${appUrl}/admin/withdrawals`, ctaLabel: "Review Now",
        });
        break;
      }

      case "suspicious_login": {
        subject = `[Admin] Suspicious Login Detected`;
        html = adminEmail({
          badgeColor: "#ef4444", badgeLabel: "Security Alert",
          title: "Suspicious login activity detected",
          rows: [
            ["User",  userEmail],
            ["IP",    String(body.ip       ?? "—")],
            ["Time",  new Date().toUTCString()],
          ],
          ctaHref: `${appUrl}/admin/users`, ctaLabel: "Review User",
        });
        break;
      }

      default: {
        subject = body.subject ?? `[Admin] Notification — ${eventType}`;
        html = adminEmail({
          badgeColor: "#f7931a", badgeLabel: eventType.replace(/_/g, " ").toUpperCase(),
          title: body.message ?? "Admin notification",
          rows: Object.entries(body)
            .filter(([k]) => !["type", "subject", "message"].includes(k))
            .slice(0, 8)
            .map(([k, v]) => [k, String(v)]) as [string, string][],
          ctaHref: `${appUrl}/admin`, ctaLabel: "Go to Admin",
        });
        break;
      }
    }

    if (adminEmailAddr && subject && html) {
      const sent = await dispatchEmail(supabase, {
        to_email:      adminEmailAddr,
        subject,
        html_body:     html,
        template_slug: `admin_${eventType}`,
        metadata:      { event_type: eventType, ...body },
      });
      return new Response(JSON.stringify({ ok: sent, event: eventType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, reason: "no_admin_email_or_template" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[notify-admin] unhandled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
