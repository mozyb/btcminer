
-- 1. Add email_verified to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- 2. Verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash    text NOT NULL,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token_hash)
);

CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_evt_token   ON email_verification_tokens(token_hash);

ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_evt" ON email_verification_tokens
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Email config settings (no description column)
INSERT INTO email_settings (key, value) VALUES
  ('resend_config', '{
    "api_key": "",
    "from_email": "noreply@btcminer.online",
    "from_name": "BTCMiner.online",
    "reply_to": "support@btcminer.online",
    "support_email": "support@btcminer.online",
    "verified_domain": "",
    "default_language": "en",
    "enable_logging": true,
    "enable_queue": true,
    "retry_attempts": 3,
    "enabled": true,
    "last_test_at": null,
    "last_test_status": null
  }')
ON CONFLICT (key) DO NOTHING;

INSERT INTO email_settings (key, value) VALUES
  ('email_provider', '"resend"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO email_settings (key, value) VALUES
  ('email_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO email_settings (key, value) VALUES
  ('verification_token_ttl_hours', '24')
ON CONFLICT (key) DO NOTHING;
