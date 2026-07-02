import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Shared email template ─────────────────────────────────────────────────────
function buildEmail(opts: {
  accentColor: string;
  badgeLabel: string;
  headline: string;
  bodyHtml: string;
  rows?: [string, string][];
  ctaHref?: string;
  ctaLabel?: string;
  appUrl: string;
}) {
  const rowsHtml = (opts.rows ?? []).map(([k, v]) => `
    <tr style="border-bottom:1px solid #374151;">
      <td style="padding:10px 16px;color:#9ca3af;font-size:13px;">${k}</td>
      <td style="padding:10px 16px;color:#fff;font-size:13px;font-family:monospace;text-align:right;word-break:break-all;">${v}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#0a0a0a;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;">
  <tr><td style="background:#f7931a;padding:20px 28px;">
    <p style="margin:0;color:#000;font-size:18px;font-weight:700;">BTCMiner.online</p>
    <p style="margin:4px 0 0;color:#000;font-size:13px;opacity:0.7;">${opts.headline}</p>
  </td></tr>
  <tr><td style="padding:24px 28px 8px;">
    <span style="display:inline-block;background:${opts.accentColor}22;color:${opts.accentColor};border:1px solid ${opts.accentColor}55;border-radius:6px;padding:4px 14px;font-size:13px;font-weight:600;">${opts.badgeLabel}</span>
  </td></tr>
  <tr><td style="padding:12px 28px;color:#d1d5db;font-size:15px;line-height:1.7;">${opts.bodyHtml}</td></tr>
  ${rowsHtml ? `<tr><td style="padding:0 28px 24px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:8px;overflow:hidden;">${rowsHtml}</table></td></tr>` : ""}
  ${opts.ctaHref ? `<tr><td style="padding:0 28px 28px;" align="center"><a href="${opts.ctaHref}" style="display:inline-block;background:#f7931a;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:8px;">${opts.ctaLabel ?? "View"} →</a></td></tr>` : ""}
  <tr><td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;">
    <p style="margin:0;color:#4b5563;font-size:12px;">Need help? <a href="${opts.appUrl}/dashboard/support" style="color:#f7931a;">Contact Support</a></p>
    <p style="margin:6px 0 0;color:#374151;font-size:12px;">— The BTCMiner.online Team</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Send via email-send edge function (handles logging + queuing) ─────────────
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
      priority:      5,
      metadata:      opts.metadata ?? {},
    },
  });
  if (error) {
    console.error("[notify-user] email-send invoke error:", error);
    return false;
  }
  const result = data as { delivery_status?: string; error?: string } | null;
  if (result?.error) {
    console.error("[notify-user] email-send returned error:", result.error);
    return false;
  }
  console.log("[notify-user] email dispatched:", result?.delivery_status ?? "queued");
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const eventType: string = payload.type ?? "generic";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const appUrl     = Deno.env.get("APP_URL") ?? "https://btcminer.online";
    const userEmail: string = payload.user_email ?? "";
    const userId: string   = payload.user_id   ?? "";

    // ── Resolve user email from DB if not provided ─────────────────────────
    let resolvedEmail = userEmail;
    if (!resolvedEmail && userId) {
      const { data: p } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
      resolvedEmail = p?.email ?? "";
    }

    if (!resolvedEmail) {
      console.warn("[notify-user] no email for event:", eventType, "user_id:", userId);
      return new Response(JSON.stringify({ ok: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── In-app notification (non-blocking) ────────────────────────────────
    let notifTitle   = "";
    let notifMessage = "";
    let notifType    = "info";
    let subject      = "";
    let html         = "";

    // ── Build email per event type ────────────────────────────────────────
    switch (eventType) {

      case "user_registered":
      case "welcome": {
        subject = "Welcome to BTCMiner.online — Your Cloud Mining Journey Starts Now";
        html = buildEmail({
          accentColor: "#f7931a", badgeLabel: "Welcome",
          headline: "Welcome to BTCMiner.online",
          bodyHtml: `Welcome aboard! Your account has been created successfully.<br><br>You can now browse our mining contract marketplace, deposit funds, and start earning Bitcoin rewards.<br><br>If you have any questions, our support team is available 24/7.`,
          ctaHref: `${appUrl}/dashboard`, ctaLabel: "Go to Dashboard", appUrl,
        });
        notifTitle = "Welcome to BTCMiner.online!";
        notifMessage = "Your account is ready. Start mining today.";
        notifType = "success";
        break;
      }

      case "email_verification":
      case "verify_email": {
        const token = payload.token ?? "";
        const verifyUrl = `${appUrl}/verify-email?token=${token}`;
        subject = "Verify Your Email Address — BTCMiner.online";
        html = buildEmail({
          accentColor: "#3b82f6", badgeLabel: "Email Verification",
          headline: "Verify your email address",
          bodyHtml: `Please verify your email address to complete your account setup and unlock all features.`,
          rows: [["Verification Link", verifyUrl]],
          ctaHref: verifyUrl, ctaLabel: "Verify Email", appUrl,
        });
        notifTitle = "Email verification sent";
        notifMessage = "Please check your inbox and verify your email.";
        notifType = "info";
        break;
      }

      case "password_reset": {
        const resetUrl = payload.reset_url ?? `${appUrl}/reset-password`;
        subject = "Password Reset Request — BTCMiner.online";
        html = buildEmail({
          accentColor: "#ef4444", badgeLabel: "Security Alert",
          headline: "Password reset requested",
          bodyHtml: `We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.<br><br>If you did not request this, please ignore this email.`,
          ctaHref: resetUrl, ctaLabel: "Reset Password", appUrl,
        });
        notifTitle = "Password reset email sent";
        notifMessage = "Check your email for the reset link.";
        notifType = "warning";
        break;
      }

      case "deposit_created": {
        subject = "Deposit Received — BTCMiner.online";
        html = buildEmail({
          accentColor: "#f7931a", badgeLabel: "Deposit Received",
          headline: "Your deposit is being processed",
          bodyHtml: `We have received your deposit request. Our team will verify the transaction and credit your account shortly (usually within 1–3 hours).`,
          rows: [
            ["Amount",     `${payload.amount ?? "—"} ${payload.currency ?? "BTC"}`],
            ["Network",    String(payload.network ?? payload.currency ?? "—")],
            ["Transaction",String(payload.transaction_id ?? "Pending")],
            ["Status",     "Pending Verification"],
          ],
          ctaHref: `${appUrl}/dashboard/transactions`, ctaLabel: "View Transactions", appUrl,
        });
        notifTitle   = "Deposit received";
        notifMessage = `Your ${payload.currency ?? "BTC"} deposit is under review.`;
        notifType    = "success";
        break;
      }

      case "deposit_confirmed": {
        subject = "Deposit Confirmed — Funds Added to Your Account";
        html = buildEmail({
          accentColor: "#22c55e", badgeLabel: "Deposit Confirmed",
          headline: "Your deposit has been confirmed",
          bodyHtml: `Great news! Your deposit has been verified and added to your account balance. You can now use these funds to purchase mining contracts.`,
          rows: [
            ["Amount",  `${payload.amount ?? "—"} ${payload.currency ?? "BTC"}`],
            ["Status",  "Confirmed"],
          ],
          ctaHref: `${appUrl}/dashboard/marketplace`, ctaLabel: "Browse Mining Contracts", appUrl,
        });
        notifTitle   = "Deposit confirmed!";
        notifMessage = `${payload.currency ?? "BTC"} deposit confirmed and credited.`;
        notifType    = "success";
        break;
      }

      case "deposit_failed": {
        subject = "Deposit Issue — Action Required";
        html = buildEmail({
          accentColor: "#ef4444", badgeLabel: "Deposit Failed",
          headline: "We couldn't process your deposit",
          bodyHtml: `There was an issue processing your deposit. Please contact support with your transaction details.`,
          rows: [["Reason", String(payload.reason ?? "Unknown")]],
          ctaHref: `${appUrl}/dashboard/support`, ctaLabel: "Contact Support", appUrl,
        });
        notifTitle   = "Deposit issue";
        notifMessage = "There was a problem with your deposit. Please contact support.";
        notifType    = "error";
        break;
      }

      case "withdrawal_requested": {
        subject = "Withdrawal Request Submitted — BTCMiner.online";
        html = buildEmail({
          accentColor: "#f7931a", badgeLabel: "Withdrawal Requested",
          headline: "Your withdrawal request has been received",
          bodyHtml: `Your withdrawal request is queued for processing. Our team reviews withdrawals within 1–24 hours.`,
          rows: [
            ["Amount",    `${payload.amount ?? "—"} ${payload.currency ?? "BTC"}`],
            ["Address",   String(payload.destination_address ?? "—")],
            ["Status",    "Pending Approval"],
          ],
          ctaHref: `${appUrl}/dashboard/transactions`, ctaLabel: "View Status", appUrl,
        });
        notifTitle   = "Withdrawal submitted";
        notifMessage = `Withdrawal of ${payload.amount ?? ""} ${payload.currency ?? "BTC"} is pending approval.`;
        notifType    = "info";
        break;
      }

      case "withdrawal_approved": {
        subject = "Withdrawal Approved — Processing Now";
        html = buildEmail({
          accentColor: "#22c55e", badgeLabel: "Withdrawal Approved",
          headline: "Your withdrawal has been approved",
          bodyHtml: `Your withdrawal has been approved and is being processed. Funds will arrive in your wallet within 1–6 hours depending on network congestion.`,
          rows: [
            ["Amount",  `${payload.amount ?? "—"} ${payload.currency ?? "BTC"}`],
            ["Status",  "Processing"],
          ],
          ctaHref: `${appUrl}/dashboard/transactions`, ctaLabel: "View Transactions", appUrl,
        });
        notifTitle   = "Withdrawal approved";
        notifMessage = "Your withdrawal is being processed.";
        notifType    = "success";
        break;
      }

      case "withdrawal_rejected": {
        subject = "Withdrawal Not Approved — BTCMiner.online";
        html = buildEmail({
          accentColor: "#ef4444", badgeLabel: "Withdrawal Rejected",
          headline: "Your withdrawal could not be processed",
          bodyHtml: `Unfortunately your withdrawal request was not approved. The funds have been returned to your account balance.`,
          rows: [["Reason", String(payload.reason ?? "Please contact support for details")]],
          ctaHref: `${appUrl}/dashboard/support`, ctaLabel: "Contact Support", appUrl,
        });
        notifTitle   = "Withdrawal rejected";
        notifMessage = "Your withdrawal was rejected. Funds returned to balance.";
        notifType    = "error";
        break;
      }

      case "withdrawal_completed": {
        subject = "Withdrawal Completed — Funds Sent";
        html = buildEmail({
          accentColor: "#22c55e", badgeLabel: "Withdrawal Completed",
          headline: "Your funds have been sent",
          bodyHtml: `Your withdrawal has been completed successfully. The funds have been broadcast to the Bitcoin network.`,
          rows: [
            ["Amount",  `${payload.amount ?? "—"} ${payload.currency ?? "BTC"}`],
            ["TxHash",  String(payload.tx_hash ?? "—")],
            ["Status",  "Completed"],
          ],
          ctaHref: `${appUrl}/dashboard/transactions`, ctaLabel: "View Transactions", appUrl,
        });
        notifTitle   = "Withdrawal completed";
        notifMessage = "Funds have been sent successfully.";
        notifType    = "success";
        break;
      }

      case "contract_purchased": {
        subject = `Mining Contract Active — ${payload.contract_name ?? "Contract"} | BTCMiner.online`;
        html = buildEmail({
          accentColor: "#f7931a", badgeLabel: "Contract Active",
          headline: "Your mining contract is now active",
          bodyHtml: `Your mining contract has been activated and is now generating rewards. You can monitor your mining performance in real time from your dashboard.`,
          rows: [
            ["Contract",  String(payload.contract_name  ?? "—")],
            ["Hashrate",  String(payload.hashrate        ?? "—")],
            ["Duration",  String(payload.duration        ?? "—")],
            ["Amount Paid", `$${payload.amount ?? "—"}`],
            ["Mining Pool", String(payload.pool_name ?? "BTCMiner Pool")],
            ["Farm",       String(payload.farm_name ?? "Global")],
          ],
          ctaHref: `${appUrl}/dashboard/mining`, ctaLabel: "View Mining Dashboard", appUrl,
        });
        notifTitle   = "Mining contract activated!";
        notifMessage = `${payload.contract_name ?? "Your contract"} is now active.`;
        notifType    = "success";
        break;
      }

      case "mining_reward": {
        subject = "Mining Reward Credited — BTCMiner.online";
        html = buildEmail({
          accentColor: "#f7931a", badgeLabel: "Reward Credited",
          headline: "You earned mining rewards",
          bodyHtml: `Your daily mining rewards have been credited to your account balance.`,
          rows: [
            ["Reward",   `${payload.amount ?? "—"} BTC`],
            ["Contract", String(payload.contract_name ?? "—")],
            ["Date",     new Date().toLocaleDateString()],
          ],
          ctaHref: `${appUrl}/dashboard`, ctaLabel: "View Dashboard", appUrl,
        });
        notifTitle   = "Mining reward received";
        notifMessage = `${payload.amount ?? ""} BTC credited to your account.`;
        notifType    = "success";
        break;
      }

      case "kyc_submitted": {
        subject = "KYC Documents Received — Under Review";
        html = buildEmail({
          accentColor: "#3b82f6", badgeLabel: "KYC Submitted",
          headline: "Your KYC documents are under review",
          bodyHtml: `We have received your identity verification documents. Our compliance team will review them within 1–3 business days. You will be notified once the review is complete.`,
          ctaHref: `${appUrl}/dashboard/kyc`, ctaLabel: "View KYC Status", appUrl,
        });
        notifTitle   = "KYC submitted";
        notifMessage = "Your identity documents are under review.";
        notifType    = "info";
        break;
      }

      case "kyc_approved": {
        subject = "KYC Verified — Account Fully Unlocked";
        html = buildEmail({
          accentColor: "#22c55e", badgeLabel: "KYC Approved",
          headline: "Your identity has been verified",
          bodyHtml: `Congratulations! Your identity verification has been approved. Your account now has full access to all features including higher withdrawal limits.`,
          ctaHref: `${appUrl}/dashboard`, ctaLabel: "Explore Full Features", appUrl,
        });
        notifTitle   = "KYC approved!";
        notifMessage = "Your identity is verified. Full account access unlocked.";
        notifType    = "success";
        break;
      }

      case "kyc_rejected": {
        subject = "KYC Review — Additional Information Required";
        html = buildEmail({
          accentColor: "#ef4444", badgeLabel: "KYC Action Required",
          headline: "Additional verification required",
          bodyHtml: `We were unable to verify your identity with the documents provided. Please resubmit with clearer or additional documentation.`,
          rows: [["Reason", String(payload.reason ?? "Please contact support for details")]],
          ctaHref: `${appUrl}/dashboard/kyc`, ctaLabel: "Resubmit Documents", appUrl,
        });
        notifTitle   = "KYC requires attention";
        notifMessage = "Please resubmit your KYC documents.";
        notifType    = "error";
        break;
      }

      case "support_ticket_created": {
        subject = `Support Ticket #${payload.ticket_id ?? "New"} — BTCMiner.online`;
        html = buildEmail({
          accentColor: "#3b82f6", badgeLabel: "Ticket Created",
          headline: "Your support request has been received",
          bodyHtml: `Thank you for contacting support. We have received your request and will respond within 24 hours.`,
          rows: [
            ["Ticket #",  String(payload.ticket_id ?? "—")],
            ["Subject",   String(payload.subject   ?? "—")],
            ["Priority",  String(payload.priority  ?? "Normal")],
          ],
          ctaHref: `${appUrl}/dashboard/support`, ctaLabel: "View Ticket", appUrl,
        });
        notifTitle   = "Support ticket created";
        notifMessage = `Ticket #${payload.ticket_id ?? ""} submitted. We'll respond within 24h.`;
        notifType    = "info";
        break;
      }

      case "support_ticket_updated": {
        subject = `Update on Support Ticket #${payload.ticket_id ?? ""} — BTCMiner.online`;
        html = buildEmail({
          accentColor: "#3b82f6", badgeLabel: "Ticket Updated",
          headline: "New reply on your support ticket",
          bodyHtml: `There is a new response on your support ticket. Please log in to view the reply.`,
          rows: [["Ticket #", String(payload.ticket_id ?? "—")]],
          ctaHref: `${appUrl}/dashboard/support`, ctaLabel: "View Reply", appUrl,
        });
        notifTitle   = "Support ticket updated";
        notifMessage = "New reply on your support ticket.";
        notifType    = "info";
        break;
      }

      case "support_ticket_closed": {
        subject = `Support Ticket #${payload.ticket_id ?? ""} Closed — BTCMiner.online`;
        html = buildEmail({
          accentColor: "#6b7280", badgeLabel: "Ticket Closed",
          headline: "Your support ticket has been resolved",
          bodyHtml: `Your support ticket has been marked as resolved. If you need further help, please open a new ticket.`,
          rows: [["Ticket #", String(payload.ticket_id ?? "—")]],
          ctaHref: `${appUrl}/dashboard/support`, ctaLabel: "Open New Ticket", appUrl,
        });
        notifTitle   = "Support ticket closed";
        notifMessage = "Your issue has been resolved.";
        notifType    = "success";
        break;
      }

      case "referral_joined": {
        subject = "Referral Bonus — Someone Joined Using Your Link!";
        html = buildEmail({
          accentColor: "#a855f7", badgeLabel: "Referral",
          headline: "You earned a referral reward",
          bodyHtml: `A new user signed up using your referral link. Your commission has been credited to your account.`,
          rows: [["Commission", String(payload.commission ?? "—")]],
          ctaHref: `${appUrl}/dashboard/referrals`, ctaLabel: "View Referrals", appUrl,
        });
        notifTitle   = "Referral commission earned!";
        notifMessage = `You earned a referral commission.`;
        notifType    = "success";
        break;
      }

      default: {
        // Generic fallback
        subject = payload.subject ?? `Notification from BTCMiner.online`;
        html = buildEmail({
          accentColor: "#f7931a", badgeLabel: String(eventType).replace(/_/g, " ").toUpperCase(),
          headline: "Notification from BTCMiner.online",
          bodyHtml: payload.message ?? "You have a new notification.",
          ctaHref: `${appUrl}/dashboard`, ctaLabel: "View Dashboard", appUrl,
        });
        notifTitle   = "Notification";
        notifMessage = payload.message ?? "You have a new notification.";
        break;
      }
    }

    // ── Save in-app notification ──────────────────────────────────────────
    if (userId && notifTitle) {
      await supabase.from("notifications").insert({
        user_id:  userId,
        title:    notifTitle,
        message:  notifMessage,
        type:     notifType,
        is_read:  false,
      }).then(({ error: nErr }) => {
        if (nErr) console.error("[notify-user] notification insert error:", nErr.message);
      });
    }

    // ── Send email ─────────────────────────────────────────────────────────
    if (resolvedEmail && subject && html) {
      const sent = await dispatchEmail(supabase, {
        to_email:      resolvedEmail,
        subject,
        html_body:     html,
        template_slug: eventType,
        metadata:      { user_id: userId, event_type: eventType, ...payload },
      });
      return new Response(JSON.stringify({ ok: sent, event: eventType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, event: eventType, note: "in_app_only" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[notify-user] unhandled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
