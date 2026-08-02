
-- Insert the missing auth.identities record for admin (email is a generated column, omit it)
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'admin@btcminer.online',
  '693fa698-0fd2-47e7-859e-2ab493d47bd5',
  jsonb_build_object(
    'sub',            '693fa698-0fd2-47e7-859e-2ab493d47bd5',
    'email',          'admin@btcminer.online',
    'email_verified', true,
    'provider',       'email'
  ),
  'email',
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;
