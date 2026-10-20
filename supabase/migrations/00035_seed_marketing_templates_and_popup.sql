CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_sequences_type ON public.automation_sequences(type);

INSERT INTO public.email_templates (category, slug, name, subject, html_body, text_body, variables, is_active, is_default, version)
VALUES
  (
    'newsletter',
    'welcome_lead',
    'Welcome Lead (Popup)',
    'Welcome to BTCMiner.online — your mining journey starts here',
    '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BTCMiner.online</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111827;border-radius:12px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:40px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">⚡</div>
              <h1 style="color:#f7931a;margin:0;font-size:26px;font-weight:700;">Welcome to BTCMiner.online</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;">Hi {{first_name}},</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Thanks for joining our early-access list. You now have a front-row seat to the easiest way to mine Bitcoin in the cloud.</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Create a free account, verify your email, and start earning BTC today with our managed Antminer farms.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
                <tr>
                  <td style="background:#f7931a;border-radius:8px;text-align:center;">
                    <a href="{{dashboard_link}}" style="display:inline-block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Create Free Account</a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;line-height:1.6;">Questions? Reply to this email or contact {{support_email}}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1f2937;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;">You received this because you subscribed at btcminer.online.<br>
                <a href="{{unsubscribe_link}}" style="color:#f7931a;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'Hi {{first_name}},

Welcome to BTCMiner.online! Thanks for joining our early-access list.

Create a free account and start earning BTC today:
{{dashboard_link}}

Questions? Contact {{support_email}}.

Unsubscribe: {{unsubscribe_link}}',
    '["first_name", "dashboard_link", "support_email", "unsubscribe_link"]',
    true,
    true,
    1
  ),
  (
    'authentication',
    'verify_email_reminder',
    'Verify Email Reminder',
    'Please verify your BTCMiner.online email address',
    '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111827;border-radius:12px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:40px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">✉️</div>
              <h1 style="color:#f7931a;margin:0;font-size:26px;font-weight:700;">Verify Your Email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;">Hi {{first_name}},</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">You''re almost ready to start mining. Please verify your email address to secure your account and unlock deposits.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
                <tr>
                  <td style="background:#f7931a;border-radius:8px;text-align:center;">
                    <a href="{{verification_link}}" style="display:inline-block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;line-height:1.6;">If the button doesn''t work, copy and paste this link into your browser:<br>{{verification_link}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1f2937;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;">This email was sent to {{email}} by BTCMiner.online.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'Hi {{first_name}},

Please verify your email address to secure your account:
{{verification_link}}

If the link does not work, copy and paste it into your browser.

This email was sent to {{email}} by BTCMiner.online.',
    '["first_name", "email", "verification_link"]',
    true,
    true,
    1
  ),
  (
    'wallet',
    'no_deposit_nudge',
    'No Deposit Nudge',
    'Your BTCMiner wallet is waiting — make your first deposit',
    '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Make Your First Deposit</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111827;border-radius:12px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:40px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">💰</div>
              <h1 style="color:#f7931a;margin:0;font-size:26px;font-weight:700;">Fund Your Wallet</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;">Hi {{first_name}},</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Your account is verified and your wallet is ready. The next step is to add Bitcoin so you can reserve hashpower and start earning.</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Most miners deposit via BTC. Funds are secured in cold-storage infrastructure and available instantly for contract purchases.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
                <tr>
                  <td style="background:#f7931a;border-radius:8px;text-align:center;">
                    <a href="{{dashboard_link}}/deposit" style="display:inline-block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Deposit Now</a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;line-height:1.6;">Need help? Contact {{support_email}}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1f2937;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;">This email was sent to {{email}} by BTCMiner.online.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'Hi {{first_name}},

Your account is verified and your wallet is ready. Make your first deposit to start mining:
{{dashboard_link}}/deposit

Need help? Contact {{support_email}}.

This email was sent to {{email}} by BTCMiner.online.',
    '["first_name", "email", "dashboard_link", "support_email"]',
    true,
    true,
    1
  ),
  (
    'mining',
    'no_contract_nudge',
    'No Contract Nudge',
    'Start mining today — pick a contract that fits you',
    '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pick Your Mining Contract</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111827;border-radius:12px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:40px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">⛏️</div>
              <h1 style="color:#f7931a;margin:0;font-size:26px;font-weight:700;">Your Mining Contract Awaits</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;">Hi {{first_name}},</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">You have funds in your wallet but no active contract yet. Let your Bitcoin work for you with SHA-256 cloud mining contracts.</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Choose from daily, yearly, or lifetime plans. Mining starts the moment your purchase confirms.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
                <tr>
                  <td style="background:#f7931a;border-radius:8px;text-align:center;">
                    <a href="{{dashboard_link}}/marketplace" style="display:inline-block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Browse Contracts</a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;line-height:1.6;">Need help choosing? Contact {{support_email}}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1f2937;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;">This email was sent to {{email}} by BTCMiner.online.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'Hi {{first_name}},

You have funds in your wallet but no active contract yet. Browse our mining contracts:
{{dashboard_link}}/marketplace

Need help choosing? Contact {{support_email}}.

This email was sent to {{email}} by BTCMiner.online.',
    '["first_name", "email", "dashboard_link", "support_email"]',
    true,
    true,
    1
  ),
  (
    'mining',
    'abandoned_purchase_recovery',
    'Abandoned Purchase Recovery',
    'You left hashpower in your cart — complete your purchase',
    '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Purchase</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e2e8f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111827;border-radius:12px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:40px 32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">🛒</div>
              <h1 style="color:#f7931a;margin:0;font-size:26px;font-weight:700;">Complete Your Mining Order</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;">Hi {{first_name}},</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">You selected <strong style="color:#f7931a;">{{contract_name}}</strong> but didn''t finish checkout. Your reserved hashpower may be released if demand increases.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#0b1220;border:1px solid #1f2937;border-radius:8px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0;color:#94a3b8;font-size:13px;">Contract</p>
                    <p style="margin:4px 0 0;color:#f1f5f9;font-size:16px;font-weight:600;">{{contract_name}}</p>
                    <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">Hashrate</p>
                    <p style="margin:4px 0 0;color:#f1f5f9;font-size:16px;font-weight:600;">{{hashrate}}</p>
                    <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">Price</p>
                    <p style="margin:4px 0 0;color:#f7931a;font-size:18px;font-weight:700;">${{contract_price}}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
                <tr>
                  <td style="background:#f7931a;border-radius:8px;text-align:center;">
                    <a href="{{dashboard_link}}/marketplace" style="display:inline-block;padding:14px 28px;color:#000;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Complete Purchase</a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;line-height:1.6;">Questions? Contact {{support_email}}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1f2937;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;">This email was sent to {{email}} by BTCMiner.online.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'Hi {{first_name}},

You selected {{contract_name}} ({{hashrate}}) at ${{contract_price}} but did not finish checkout.

Complete your purchase here:
{{dashboard_link}}/marketplace

Questions? Contact {{support_email}}.

This email was sent to {{email}} by BTCMiner.online.',
    '["first_name", "email", "contract_name", "hashrate", "contract_price", "dashboard_link", "support_email"]',
    true,
    true,
    1
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.popup_configs (
  title, subtitle, description, button_text, cta_url, background_image, banner_image,
  is_active, expires_at, display_frequency, cooldown_hours,
  trigger_delay_seconds, trigger_scroll_pct, trigger_exit_intent, trigger_multi_page, multi_page_threshold
)
VALUES (
  'Get 10% Off Your First Contract',
  'Limited time for new visitors',
  'Join thousands of miners earning Bitcoin daily with our managed cloud mining contracts. No hardware. No noise. Just BTC rewards.',
  'Claim 10% Off',
  '/register',
  NULL,
  NULL,
  true,
  NULL,
  'once_per_day',
  12,
  10,
  40,
  true,
  true,
  2
)
ON CONFLICT DO NOTHING;

INSERT INTO public.promotions (
  name, promo_type, discount_value, coupon_code, start_date, end_date, max_redemptions, max_per_user, is_active
)
VALUES (
  'Welcome 10% Off First Contract',
  'percentage',
  10,
  'WELCOME10',
  now(),
  now() + interval '90 days',
  1000,
  1,
  true
)
ON CONFLICT (coupon_code) DO NOTHING;

INSERT INTO public.automation_sequences (name, type, is_active)
VALUES
  ('Unverified Email Reminder', 'unverified_reminder', true),
  ('No First Deposit', 'no_deposit', true),
  ('No Contract Purchase', 'no_contract', true),
  ('Abandoned Purchase Recovery', 'abandoned_purchase', true)
ON CONFLICT (type) DO NOTHING;

INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text, promotion_id)
SELECT
  s.id,
  step.step_order,
  step.delay_hours,
  step.subject,
  step.body_html,
  step.body_text,
  (SELECT id FROM public.promotions WHERE coupon_code = 'WELCOME10' LIMIT 1)
FROM public.automation_sequences s,
  (VALUES
    ('unverified_reminder', 1, 24, 'Reminder: Please verify your BTCMiner.online email',
      '<p>Hi {{first_name}},</p><p>Please verify your email to secure your account and unlock deposits.</p><p><a href="{{verification_link}}" style="color:#f7931a;font-weight:bold;">Verify Email</a></p><p>Questions? Contact {{support_email}}.</p>',
      'Hi {{first_name}}, please verify your email: {{verification_link}}'),
    ('unverified_reminder', 2, 72, 'Final reminder: verify your email to start mining',
      '<p>Hi {{first_name}},</p><p>Your account is waiting. Verify your email in the next few minutes to begin mining Bitcoin.</p><p><a href="{{verification_link}}" style="color:#f7931a;font-weight:bold;">Verify Email</a></p><p>Need help? Contact {{support_email}}.</p>',
      'Hi {{first_name}}, your account is waiting. Verify your email: {{verification_link}}'),
    ('no_deposit', 1, 24, 'Make your first deposit and start mining',
      '<p>Hi {{first_name}},</p><p>Your BTCMiner wallet is ready. Add Bitcoin to reserve hashpower and start earning.</p><p><a href="{{dashboard_link}}/deposit" style="color:#f7931a;font-weight:bold;">Deposit Now</a></p><p>Use code <strong>WELCOME10</strong> for 10% off your first contract.</p>',
      'Hi {{first_name}}, make your first deposit: {{dashboard_link}}/deposit. Use code WELCOME10 for 10% off.'),
    ('no_deposit', 2, 72, 'Don''t miss out on Bitcoin mining rewards',
      '<p>Hi {{first_name}},</p><p>Depositing is fast and secure. Once funded, you can purchase a contract and mining starts immediately.</p><p><a href="{{dashboard_link}}/deposit" style="color:#f7931a;font-weight:bold;">Deposit Now</a></p>',
      'Hi {{first_name}}, deposit now: {{dashboard_link}}/deposit'),
    ('no_contract', 1, 24, 'Pick a mining contract and earn BTC today',
      '<p>Hi {{first_name}},</p><p>You have funds in your wallet. Browse SHA-256 cloud mining contracts and start earning.</p><p><a href="{{dashboard_link}}/marketplace" style="color:#f7931a;font-weight:bold;">Browse Contracts</a></p><p>Use code <strong>WELCOME10</strong> for 10% off.</p>',
      'Hi {{first_name}}, browse contracts: {{dashboard_link}}/marketplace. Use code WELCOME10 for 10% off.'),
    ('no_contract', 2, 72, 'Your hashpower is waiting — complete your first contract',
      '<p>Hi {{first_name}},</p><p>Every day without a contract is a day of missed Bitcoin rewards. Pick a plan and start mining.</p><p><a href="{{dashboard_link}}/marketplace" style="color:#f7931a;font-weight:bold;">Browse Contracts</a></p>',
      'Hi {{first_name}}, browse contracts: {{dashboard_link}}/marketplace'),
    ('abandoned_purchase', 1, 1, 'You left hashpower in your cart — complete your purchase',
      '<p>Hi {{first_name}},</p><p>You selected <strong>{{contract_name}}</strong> at <strong>${{contract_price}}</strong> but did not finish checkout.</p><p><a href="{{dashboard_link}}/marketplace" style="color:#f7931a;font-weight:bold;">Complete Purchase</a></p><p>Use code <strong>WELCOME10</strong> for 10% off.</p>',
      'Hi {{first_name}}, you left {{contract_name}} at ${{contract_price}} in your cart. Complete your purchase: {{dashboard_link}}/marketplace. Use code WELCOME10.'),
    ('abandoned_purchase', 2, 24, 'Last chance: your contract reservation is about to expire',
      '<p>Hi {{first_name}},</p><p>Your <strong>{{contract_name}}</strong> selection is still available. Complete checkout before it is released to other miners.</p><p><a href="{{dashboard_link}}/marketplace" style="color:#f7931a;font-weight:bold;">Complete Purchase</a></p>',
      'Hi {{first_name}}, your {{contract_name}} selection is still available. Complete checkout: {{dashboard_link}}/marketplace')
  ) AS step(type, step_order, delay_hours, subject, body_html, body_text)
WHERE s.type = step.type
  AND NOT EXISTS (
    SELECT 1 FROM public.automation_sequence_steps existing
    WHERE existing.sequence_id = s.id AND existing.step_order = step.step_order
  );