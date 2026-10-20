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
-- 2. Create educational email templates for the new sequences
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.email_templates (slug, category, name, subject, html_body, text_body, is_active)
VALUES
  ('getting_started', 'newsletter', 'Getting Started', 'Getting started with BTCMiner.online',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Getting Started</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your account is verified. Here are the three simple steps to start earning Bitcoin:</p><ol style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;"><li>Make your first deposit into your BTCMiner wallet.</li><li>Choose a mining contract that matches your goals.</li><li>Watch your dashboard for real-time mining rewards.</li></ol><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is still active and will be applied automatically at checkout.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Go to Dashboard</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nYour account is verified. Here are the three simple steps to start earning Bitcoin:\n1. Make your first deposit.\n2. Choose a mining contract.\n3. Watch your dashboard for real-time rewards.\n\nYour 10% welcome discount is still active.\n\nDashboard: {{dashboard_link}}', true),
  ('how_cloud_mining_works', 'newsletter', 'How Cloud Mining Works', 'How cloud mining works',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">How Cloud Mining Works</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Cloud mining lets you rent mining hardware hosted in professional data centers. You earn a share of the Bitcoin mined without managing physical machines.</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is still active and will be applied automatically.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Explore Contracts</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nCloud mining lets you rent mining hardware hosted in professional data centers. You earn a share of the Bitcoin mined without managing physical machines.\n\nYour 10% welcome discount is still active.\n\nExplore contracts: {{dashboard_link}}', true),
  ('choosing_contract', 'newsletter', 'Choosing a Mining Contract', 'Choosing a mining contract that fits you',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Choosing a Mining Contract</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Pick a contract based on your budget and goals. Contracts vary by hashrate, duration, and maintenance fee. All costs are transparent before checkout.</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is still active and will be applied automatically.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">View Contracts</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nPick a contract based on your budget and goals. All costs are transparent before checkout.\n\nYour 10% welcome discount is still active.\n\nView contracts: {{dashboard_link}}', true),
  ('current_mining_opportunities', 'newsletter', 'Current Mining Opportunities', 'Current mining opportunities',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Current Mining Opportunities</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Now is a great time to start mining. Check the marketplace for available contracts and live hashrate pricing.</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is still active and will be applied automatically.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Browse Marketplace</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nNow is a great time to start mining. Check the marketplace for available contracts and live hashrate pricing.\n\nYour 10% welcome discount is still active.\n\nBrowse marketplace: {{dashboard_link}}', true),
  ('how_to_buy_contract', 'newsletter', 'How to Buy a Mining Contract', 'How to buy your first mining contract',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">How to Buy a Mining Contract</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">You have a deposit ready. Buying a contract is easy:</p><ol style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;"><li>Go to the Marketplace.</li><li>Choose a contract and click Buy.</li><li>Review your 10% welcome discount applied automatically.</li><li>Confirm your purchase.</li></ol><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Buy a Contract</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nYou have a deposit ready. Buying a contract is easy:\n1. Go to the Marketplace.\n2. Choose a contract.\n3. Your 10% welcome discount is applied automatically.\n4. Confirm.\n\nBuy a contract: {{dashboard_link}}', true),
  ('available_contracts', 'newsletter', 'Available Contracts', 'Available mining contracts today',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Available Mining Contracts</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Browse the current selection of cloud mining contracts. Your 10% welcome discount is automatically applied at checkout.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">View Contracts</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nBrowse the current selection of cloud mining contracts. Your 10% welcome discount is automatically applied at checkout.\n\nView contracts: {{dashboard_link}}', true),
  ('mining_pools', 'newsletter', 'Mining Pools', 'Our mining pools',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Our Mining Pools</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">BTCMiner partners with reliable mining pools to provide consistent payouts and transparent performance. Your 10% welcome discount is still active.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Go to Dashboard</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nBTCMiner partners with reliable mining pools to provide consistent payouts and transparent performance. Your 10% welcome discount is still active.\n\nDashboard: {{dashboard_link}}', true),
  ('mining_farms', 'newsletter', 'Mining Farms', 'Our transparent mining farms',
   '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Our Mining Farms</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Our infrastructure is hosted in enterprise-grade facilities with reliable uptime, cooling, and security. Your 10% welcome discount is still active.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Start Mining Now</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
   'Hi {{first_name}},\n\nOur infrastructure is hosted in enterprise-grade facilities with reliable uptime, cooling, and security. Your 10% welcome discount is still active.\n\nStart mining: {{dashboard_link}}', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Update sequence steps with new timings and templates
-- ═══════════════════════════════════════════════════════════════════════════

-- Unverified reminder: 1h, 24h, 3d, 7d
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'unverified_reminder' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    VALUES
      (v_seq_id, 1, 1, 'Please verify your BTCMiner.online email address',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Verify Your Email</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Please verify your email address to activate your account and unlock your 10% welcome discount.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Verify My Email</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nPlease verify your email address to activate your account and unlock your 10% welcome discount.\n\nVerify: {{verification_link}}'),
      (v_seq_id, 2, 24, 'Reminder: verify your email to unlock your welcome discount',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is reserved, but you still need to verify your email to activate it.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Verify My Email</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nYour 10% welcome discount is reserved. Verify your email to activate it.\n\nVerify: {{verification_link}}'),
      (v_seq_id, 3, 72, 'Final reminder: verify your email to start mining',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">This is a friendly reminder to verify your email and claim your 10% welcome discount before it expires.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Verify My Email</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nPlease verify your email and claim your 10% welcome discount before it expires.\n\nVerify: {{verification_link}}'),
      (v_seq_id, 4, 168, 'Your BTCMiner welcome discount is waiting',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is still reserved. Verify your email today and start mining with your discount applied automatically.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Claim My Discount</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nYour 10% welcome discount is still reserved. Verify your email today.\n\nClaim: {{verification_link}}');
  END IF;
END $$;

-- No deposit: educational sequence (getting started, how cloud mining works, choosing a contract, current opportunities)
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'no_deposit' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    SELECT v_seq_id, 1, 24, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'getting_started'
    UNION ALL
    SELECT v_seq_id, 2, 72, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'how_cloud_mining_works'
    UNION ALL
    SELECT v_seq_id, 3, 120, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'choosing_contract'
    UNION ALL
    SELECT v_seq_id, 4, 168, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'current_mining_opportunities';
  END IF;
END $$;

-- No contract: deposit reminders (how to buy, available contracts, mining pools, mining farms)
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'no_contract' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    SELECT v_seq_id, 1, 1, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'how_to_buy_contract'
    UNION ALL
    SELECT v_seq_id, 2, 24, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'available_contracts'
    UNION ALL
    SELECT v_seq_id, 3, 72, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'mining_pools'
    UNION ALL
    SELECT v_seq_id, 4, 168, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'mining_farms';
  END IF;
END $$;

-- Abandoned purchase: keep existing but update body
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'abandoned_purchase' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    VALUES
      (v_seq_id, 1, 1, 'You left hashpower in your cart — complete your purchase',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">You left hashpower in your cart. Complete your purchase now and your welcome discount will be applied automatically.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Complete Purchase</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nYou left hashpower in your cart. Complete your purchase and your welcome discount will be applied automatically.\n\nDashboard: {{dashboard_link}}'),
      (v_seq_id, 2, 24, 'Last chance: your contract reservation is about to expire',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">This is your last reminder to complete your purchase. Your welcome discount will be applied automatically at checkout.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Complete Purchase</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nLast reminder to complete your purchase. Your welcome discount will be applied automatically.\n\nDashboard: {{dashboard_link}}');
  END IF;
END $$;
