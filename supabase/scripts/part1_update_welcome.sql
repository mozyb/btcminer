-- Welcome offer sequence update: richer templates + updated sequence steps
-- Triggered once per DB apply.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Update welcome lead template to mention discount activation after verification
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE public.email_templates
SET
  html_body = '<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;">
          <span style="color:#f7931a;font-size:22px;font-weight:700;">BTC<span style="color:#ffffff;">Miner</span>.online</span>
          <h1 style="margin:16px 0 0;color:#f1f5f9;font-size:22px;font-weight:700;">Welcome to BTCMiner.online!</h1>
          <p style="margin:8px 0 0;color:#64748b;font-size:14px;">Your Bitcoin mining journey starts here</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px 24px;">
          <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi <strong style="color:#f7931a;">{{first_name}}</strong>,</p>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Thanks for your interest in BTCMiner.online. We are a transparent cloud mining platform helping people around the world earn Bitcoin with secure, enterprise-grade infrastructure.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#1f2937;border-radius:8px;padding:16px;border-left:3px solid #f7931a;">
                <p style="margin:0 0 6px;color:#e2e8f0;font-size:14px;font-weight:600;">🎁 Your 10% welcome discount is waiting</p>
                <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">Create your free account and verify your email address. The 10% discount will automatically attach to your account for your first eligible mining contract.</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;letter-spacing:0.2px;">
                Create My Free Account
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;font-weight:600;">What you get as a verified member:</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:8px;">
                <tr><td style="padding:14px 16px;">
                  <p style="margin:0 0 4px;color:#e2e8f0;font-size:14px;font-weight:600;">⚡ Instant Hashrate</p>
                  <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">Start mining Bitcoin immediately after your first contract purchase.</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 0 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:8px;">
                <tr><td style="padding:14px 16px;">
                  <p style="margin:0 0 4px;color:#e2e8f0;font-size:14px;font-weight:600;">🔒 Secure Platform</p>
                  <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">Enterprise-grade security protects your account and mining rewards.</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 0 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:8px;">
                <tr><td style="padding:14px 16px;">
                  <p style="margin:0 0 4px;color:#e2e8f0;font-size:14px;font-weight:600;">📊 Real-Time Dashboard</p>
                  <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">Monitor your earnings, hashrate, and payouts in real time.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 16px;color:#94a3b8;font-size:13px;line-height:1.6;">
            <strong>Next step:</strong> complete your registration and verify your email address. Your welcome discount will be applied automatically at checkout — no coupon code needed.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;">
          <p style="margin:0;color:#334155;font-size:12px;text-align:center;line-height:1.6;">
            <a href="{{unsubscribe_link}}" style="color:#4b5563;text-decoration:none;">Unsubscribe</a> ·
            <a href="{{dashboard_link}}" style="color:#4b5563;text-decoration:none;">Dashboard</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>',
  text_body = 'Hi {{first_name}},\n\nWelcome to BTCMiner.online! Thanks for your interest in our transparent cloud mining platform.\n\nYour 10% welcome discount is waiting. Create your free account and verify your email address. The discount will automatically attach to your account for your first eligible mining contract.\n\nCreate your account: {{dashboard_link}}\n\nNext step: verify your email and your welcome discount will be applied at checkout — no coupon code needed.\n\nUnsubscribe: {{unsubscribe_link}}',
  updated_at = now()
WHERE slug = 'welcome_lead';

-- ═══════════════════════════════════════════════════════════════════════════
