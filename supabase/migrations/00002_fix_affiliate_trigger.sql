
-- Fix create_affiliate_link to not use gen_random_bytes (requires pgcrypto)
CREATE OR REPLACE FUNCTION public.create_affiliate_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  code text;
BEGIN
  -- Use gen_random_uuid() which is always available in Supabase
  code := 'BTCM-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 5));
  INSERT INTO public.affiliate_links (user_id, referral_code)
  VALUES (NEW.id, code)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
