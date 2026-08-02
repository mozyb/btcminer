
ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS street      text,
  ADD COLUMN IF NOT EXISTS city        text,
  ADD COLUMN IF NOT EXISTS state       text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country     text,
  ADD COLUMN IF NOT EXISTS full_name   text;
