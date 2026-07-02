-- Allow lifetime contracts to have no expiry date
ALTER TABLE public.contracts ALTER COLUMN expiry_date DROP NOT NULL;