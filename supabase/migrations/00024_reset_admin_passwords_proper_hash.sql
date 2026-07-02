-- Reset admin passwords with proper bcrypt cost=10 format
-- The existing admin@btcminer.online hash uses cost=6 which may be rejected by GoTrue
UPDATE auth.users
SET 
  encrypted_password = crypt('Admin@BTCMiner2024!', gen_salt('bf', 10)),
  updated_at = now()
WHERE email = 'admin@btcminer.online';

UPDATE auth.users
SET 
  encrypted_password = crypt('Super@BTCMiner2024!', gen_salt('bf', 10)),
  updated_at = now()
WHERE email = 'superadmin@btcminer.online';

-- Ensure both users have confirmed emails and are not restricted
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  recovery_token = '',
  banned_until = NULL,
  deleted_at = NULL,
  is_sso_user = false,
  updated_at = now()
WHERE email IN ('admin@btcminer.online', 'superadmin@btcminer.online');