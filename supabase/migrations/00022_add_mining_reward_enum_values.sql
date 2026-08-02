-- Add 'mining_reward' to tx_type enum (safe — only adds if not present)
DO $$
BEGIN
  ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'mining_reward';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add 'mining' to notification_type enum (safe)
DO $$
BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'mining';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;