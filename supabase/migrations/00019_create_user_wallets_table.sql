CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('hot', 'cold')),
  provider TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  is_primary BOOLEAN DEFAULT false,
  network TEXT DEFAULT 'bitcoin',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, address)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);

-- Trigger to enforce only one primary wallet per user
CREATE OR REPLACE FUNCTION enforce_single_primary_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE user_wallets
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_primary_wallet ON user_wallets;
CREATE TRIGGER trg_single_primary_wallet
  BEFORE INSERT OR UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_primary_wallet();

-- RLS policies
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own wallets"
  ON user_wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own wallets"
  ON user_wallets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all wallets"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));