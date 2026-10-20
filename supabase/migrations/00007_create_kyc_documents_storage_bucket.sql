
-- Ensure kyc_submissions has the right status values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    CREATE TYPE kyc_status AS ENUM ('not_submitted','pending','approved','rejected');
  END IF;
END $$;
