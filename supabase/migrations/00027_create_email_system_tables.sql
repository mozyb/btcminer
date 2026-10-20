-- ─── Email Providers ─────────────────────────────────────────────────────────
CREATE TABLE email_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('smtp','ses','sendgrid','mailgun','postmark','brevo','resend','custom_smtp')),
  smtp_host text,
  smtp_port integer DEFAULT 587,
  username text,
  password text,
  api_key text,
  secret_key text,
  encryption text DEFAULT 'tls' CHECK (encryption IN ('tls','ssl','none')),
  from_email text NOT NULL,
  from_name text NOT NULL,
  reply_to_email text,
  daily_limit integer DEFAULT 10000,
  sent_today integer DEFAULT 0,
  priority integer DEFAULT 10,
  is_active boolean DEFAULT true,
  last_error text,
  last_tested_at timestamptz,
  test_status text CHECK (test_status IN ('ok','fail','untested')) DEFAULT 'untested',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_providers_admin_all" ON email_providers
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ─── Email Templates ──────────────────────────────────────────────────────────
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('authentication','security','wallet','mining','account','support','newsletter')),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL DEFAULT '',
  text_body text DEFAULT '',
  variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_admin_all" ON email_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ─── Email Queue ──────────────────────────────────────────────────────────────
CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  template_slug text,
  provider_id uuid REFERENCES email_providers(id) ON DELETE SET NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued','processing','sent','failed','dead_letter')),
  priority integer DEFAULT 5,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  queued_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX email_queue_status_idx ON email_queue(status, next_retry_at);
CREATE INDEX email_queue_created_idx ON email_queue(created_at DESC);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_queue_admin_all" ON email_queue
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "email_queue_service_insert" ON email_queue
  FOR INSERT WITH CHECK (true);

-- ─── Email Logs ───────────────────────────────────────────────────────────────
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES email_queue(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  template_slug text,
  provider_id uuid REFERENCES email_providers(id) ON DELETE SET NULL,
  provider_name text,
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending','delivered','failed','bounced','complained','opened','clicked')),
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  message_id text,
  metadata jsonb DEFAULT '{}',
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX email_logs_to_email_idx ON email_logs(to_email);
CREATE INDEX email_logs_status_idx ON email_logs(delivery_status);
CREATE INDEX email_logs_sent_at_idx ON email_logs(sent_at DESC);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_admin_all" ON email_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "email_logs_service_insert" ON email_logs
  FOR INSERT WITH CHECK (true);

-- ─── Newsletter Campaigns ─────────────────────────────────────────────────────
CREATE TABLE newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL DEFAULT '',
  text_body text DEFAULT '',
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','completed','failed','cancelled')),
  audience_filter jsonb DEFAULT '{}',
  recipient_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,
  unsubscribed_count integer DEFAULT 0,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter_campaigns_admin_all" ON newsletter_campaigns
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ─── Email Settings ───────────────────────────────────────────────────────────
CREATE TABLE email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_settings_admin_all" ON email_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ─── Default email settings ───────────────────────────────────────────────────
INSERT INTO email_settings (key, value) VALUES
('sender_identity', '{"from_email":"noreply@btcminer.online","from_name":"BTCMiner.online","reply_to":"support@btcminer.online","company_name":"BTCMiner.online","company_address":"","logo_url":"","brand_color":"#f59e0b","social_twitter":"","social_telegram":"","social_discord":"","footer_text":"You are receiving this email because you have an account at BTCMiner.online","unsubscribe_text":"Unsubscribe","privacy_url":"https://btcminer.online/privacy","terms_url":"https://btcminer.online/terms"}'),
('notification_triggers', '{"new_login":true,"new_device_login":true,"password_changed":true,"email_changed":true,"twofa_enabled":true,"twofa_disabled":true,"withdrawal_request":true,"withdrawal_completed":true,"wallet_address_changed":true,"api_key_generated":true,"account_locked":true,"suspicious_activity":true,"contract_purchased":true,"contract_expires_soon":true,"contract_expired":true,"mining_reward_credited":true,"maintenance_fee_deducted":true,"deposit_detected":true,"deposit_confirmed":true,"deposit_failed":true,"withdrawal_requested":true,"withdrawal_approved":true,"withdrawal_rejected":true,"internal_transfer":true,"welcome":true,"profile_updated":true,"kyc_submitted":true,"kyc_approved":true,"kyc_rejected":true,"referral_commission":true,"referral_registered":true,"ticket_created":true,"staff_replied":true,"ticket_closed":true,"ticket_reopened":true}'),
('queue_config', '{"max_retries":3,"retry_delay_minutes":5,"exponential_backoff":true,"concurrency":10,"paused":false,"daily_limit_per_user":20}');

-- ─── Default Email Templates ──────────────────────────────────────────────────
INSERT INTO email_templates (category, slug, name, subject, html_body, text_body, variables, is_default) VALUES
('authentication', 'welcome', 'Welcome Email', 'Welcome to {{company_name}}!',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#f59e0b;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">{{company_name}}</h1></div><div style="padding:32px"><h2 style="color:#111">Welcome, {{first_name}}!</h2><p style="color:#555;line-height:1.6">Your account has been verified and you are ready to start mining Bitcoin. Log in to your dashboard to explore contracts and start earning.</p><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">Go to Dashboard</a></div><p style="color:#888;font-size:13px">If you have any questions, contact us at <a href="mailto:{{support_email}}">{{support_email}}</a></p></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}} · <a href="{{dashboard_link}}/privacy">Privacy</a> · <a href="{{dashboard_link}}/terms">Terms</a></div></div></body></html>',
'Welcome {{first_name}}! Your account is verified. Visit {{dashboard_link}} to get started.',
'["first_name","company_name","dashboard_link","support_email","current_date"]', true),

('authentication', 'verify_email', 'Verify Email', 'Please verify your email address',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#f59e0b;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">{{company_name}}</h1></div><div style="padding:32px"><h2 style="color:#111">Verify Your Email</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, click the button below to verify your email address. This link expires in 24 hours.</p><div style="text-align:center;margin:32px 0"><a href="{{verification_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">Verify Email Address</a></div><p style="color:#888;font-size:12px">If you did not create an account, ignore this email.</p></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, verify your email: {{verification_link}}',
'["first_name","verification_link","company_name","current_date"]', true),

('authentication', 'password_reset', 'Password Reset', 'Reset your password',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#f59e0b;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">{{company_name}}</h1></div><div style="padding:32px"><h2 style="color:#111">Reset Your Password</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, you requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p><div style="text-align:center;margin:32px 0"><a href="{{reset_link}}" style="background:#ef4444;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">Reset Password</a></div><p style="color:#888;font-size:12px">If you did not request this, ignore this email. Your password will not change.</p></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, reset your password: {{reset_link}}',
'["first_name","reset_link","company_name","current_date"]', true),

('security', 'login_alert', 'Login Alert', 'New login detected on your account',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#ef4444;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">Security Alert</h1></div><div style="padding:32px"><h2 style="color:#111">New Login Detected</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, we detected a new login to your account. If this was you, no action is needed. If not, secure your account immediately.</p><div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:16px 0;border-radius:4px"><p style="margin:0;color:#555;font-size:14px"><strong>Date:</strong> {{current_date}}</p></div><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">Secure My Account</a></div></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, new login detected on {{current_date}}. Visit {{dashboard_link}} to secure your account.',
'["first_name","current_date","dashboard_link","company_name"]', true),

('wallet', 'deposit_confirmed', 'Deposit Confirmed', 'Your deposit of {{reward_amount}} has been confirmed',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#22c55e;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">Deposit Confirmed</h1></div><div style="padding:32px"><h2 style="color:#111">Your deposit has been confirmed!</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, your deposit of <strong>{{reward_amount}}</strong> has been confirmed on the blockchain.</p><div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:16px 0;border-radius:4px"><p style="margin:0;color:#555;font-size:14px"><strong>Transaction ID:</strong> {{transaction_id}}</p></div><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">View Wallet</a></div></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, deposit of {{reward_amount}} confirmed. TX: {{transaction_id}}',
'["first_name","reward_amount","transaction_id","dashboard_link","company_name","current_date"]', true),

('wallet', 'withdrawal_completed', 'Withdrawal Completed', 'Your withdrawal of {{reward_amount}} is complete',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#3b82f6;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">Withdrawal Complete</h1></div><div style="padding:32px"><h2 style="color:#111">Withdrawal Processed!</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, your withdrawal of <strong>{{reward_amount}}</strong> to <strong>{{wallet_address}}</strong> has been processed.</p><div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:16px 0;border-radius:4px"><p style="margin:0;color:#555;font-size:14px"><strong>Transaction ID:</strong> {{transaction_id}}</p></div><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">View Transactions</a></div></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, withdrawal of {{reward_amount}} to {{wallet_address}} complete. TX: {{transaction_id}}',
'["first_name","reward_amount","wallet_address","transaction_id","dashboard_link","company_name","current_date"]', true),

('mining', 'mining_reward', 'Mining Reward Credited', '₿ Mining reward of {{reward_amount}} credited to your account',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#f59e0b;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">Mining Reward Credited</h1></div><div style="padding:32px"><h2 style="color:#111">You earned Bitcoin!</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, your mining reward of <strong>{{reward_amount}} BTC</strong> has been credited from <strong>{{contract_name}}</strong>.</p><div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;margin:16px 0;border-radius:4px"><p style="margin:0;color:#555;font-size:14px"><strong>Hashrate:</strong> {{hashrate}}</p></div><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">View Dashboard</a></div></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, mining reward of {{reward_amount}} BTC credited from {{contract_name}}.',
'["first_name","reward_amount","contract_name","hashrate","dashboard_link","company_name","current_date"]', true),

('mining', 'contract_purchased', 'Contract Purchased', 'Your mining contract {{contract_name}} is now active!',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#8b5cf6;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">Contract Activated</h1></div><div style="padding:32px"><h2 style="color:#111">Mining Contract Active</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, your mining contract <strong>{{contract_name}}</strong> is now active. Hashrate: <strong>{{hashrate}}</strong>.</p><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">View My Contracts</a></div></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, your contract {{contract_name}} ({{hashrate}}) is now active!',
'["first_name","contract_name","hashrate","dashboard_link","company_name","current_date"]', true),

('support', 'ticket_created', 'Support Ticket Created', 'Ticket #{{ticket_number}} received',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0ea5e9;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">Support Ticket Received</h1></div><div style="padding:32px"><h2 style="color:#111">We received your request</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, ticket <strong>#{{ticket_number}}</strong> has been created. Our team will respond within 24 hours.</p><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">View Ticket</a></div></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, ticket #{{ticket_number}} created. We will respond within 24 hours.',
'["first_name","ticket_number","dashboard_link","company_name","current_date"]', true),

('account', 'kyc_approved', 'KYC Approved', 'Your identity has been verified ✓',
'<html><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:20px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#22c55e;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">KYC Approved</h1></div><div style="padding:32px"><h2 style="color:#111">Identity Verified!</h2><p style="color:#555;line-height:1.6">Hi {{first_name}}, your KYC verification has been approved. You now have full access to all platform features.</p><div style="text-align:center;margin:32px 0"><a href="{{dashboard_link}}" style="background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">Go to Dashboard</a></div></div><div style="background:#f4f4f5;padding:16px;text-align:center;font-size:12px;color:#999">© {{current_date}} {{company_name}}</div></div></body></html>',
'Hi {{first_name}}, your KYC has been approved! You now have full platform access.',
'["first_name","dashboard_link","company_name","current_date"]', true);
