-- ROOT CAUSE FIX: admin@btcminer.online identity has provider_id = email address
-- GoTrue (new versions) requires provider_id = user UUID for email provider
-- Normal users created via auth API have provider_id = user_id (UUID)
UPDATE auth.identities
SET 
  provider_id = user_id::text,
  identity_data = jsonb_build_object(
    'sub',            user_id::text,
    'email',          'admin@btcminer.online',
    'email_verified', true,
    'phone_verified', false
  ),
  updated_at = now()
WHERE user_id = '693fa698-0fd2-47e7-859e-2ab493d47bd5'
  AND provider = 'email';

-- Also fix raw_user_meta_data to match what GoTrue expects
UPDATE auth.users
SET
  raw_user_meta_data = jsonb_build_object(
    'sub',            id::text,
    'email',          'admin@btcminer.online',
    'email_verified', true,
    'phone_verified', false
  ),
  updated_at = now()
WHERE id = '693fa698-0fd2-47e7-859e-2ab493d47bd5';