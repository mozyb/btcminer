
-- ─── Contract Templates ──────────────────────────────────────────────────────
CREATE TABLE contract_templates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  display_name            text NOT NULL,
  slug                    text NOT NULL UNIQUE,
  description             text,
  short_description       text,
  -- Mining
  coin                    text NOT NULL DEFAULT 'Bitcoin',
  algorithm               text NOT NULL DEFAULT 'SHA-256',
  hashrate                numeric NOT NULL DEFAULT 100,
  hashrate_unit           text NOT NULL DEFAULT 'TH/s',
  mining_pool             text,
  mining_farm             text,
  hardware                text,
  duration                integer NOT NULL DEFAULT 30,
  is_lifetime             boolean NOT NULL DEFAULT false,
  estimated_daily_reward  numeric NOT NULL DEFAULT 0,
  estimated_monthly_reward numeric NOT NULL DEFAULT 0,
  estimated_annual_reward  numeric NOT NULL DEFAULT 0,
  reward_method           text NOT NULL DEFAULT 'fixed',
  maintenance_fee         numeric NOT NULL DEFAULT 0,
  electricity_fee         numeric NOT NULL DEFAULT 0,
  pool_fee                numeric NOT NULL DEFAULT 0,
  -- Pricing
  price                   numeric NOT NULL DEFAULT 0,
  discount_price          numeric,
  promotional_price       numeric,
  currency                text NOT NULL DEFAULT 'USD',
  tax                     numeric NOT NULL DEFAULT 0,
  min_purchase            integer NOT NULL DEFAULT 1,
  max_purchase            integer NOT NULL DEFAULT 100,
  -- Performance
  estimated_btc_production    numeric NOT NULL DEFAULT 0,
  estimated_usd_value         numeric NOT NULL DEFAULT 0,
  network_difficulty_multiplier numeric NOT NULL DEFAULT 1,
  pool_efficiency             numeric NOT NULL DEFAULT 98,
  hardware_efficiency         numeric NOT NULL DEFAULT 100,
  -- Availability
  available_capacity      integer NOT NULL DEFAULT 1000,
  remaining_capacity      integer NOT NULL DEFAULT 1000,
  max_per_user            integer NOT NULL DEFAULT 10,
  -- Status & visibility
  status                  text NOT NULL DEFAULT 'active',
  visibility              text NOT NULL DEFAULT 'public',
  featured                boolean NOT NULL DEFAULT false,
  badge                   text,
  -- Media
  image_url               text,
  banner_url              text,
  -- SEO
  seo_title               text,
  meta_description        text,
  keywords                text,
  canonical_url           text,
  -- Admin
  notes                   text,
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Public can read active/public contracts
CREATE POLICY "contract_templates_public_read" ON contract_templates
  FOR SELECT USING (status = 'active' AND visibility = 'public');

-- Admins have full access
CREATE POLICY "contract_templates_admin_all" ON contract_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed with existing mock contracts
INSERT INTO contract_templates (name, display_name, slug, coin, algorithm, hashrate, hashrate_unit, hardware, duration, price, maintenance_fee, available_capacity, remaining_capacity, featured, badge, sort_order, short_description, estimated_daily_reward, estimated_monthly_reward, estimated_annual_reward, estimated_btc_production, estimated_usd_value) VALUES
('Starter SHA-256', 'Starter SHA-256', 'starter-sha256', 'Bitcoin', 'SHA-256', 100, 'TH/s', 'Bitmain Antminer S21 XP', 30, 1250, 0.0028, 847, 847, false, null, 1, 'Entry-level Bitcoin mining contract with 100 TH/s hashrate.', 0.000050, 0.00150, 0.01825, 0.00150, 101),
('Pro SHA-256', 'Pro SHA-256', 'pro-sha256', 'Bitcoin', 'SHA-256', 500, 'TH/s', 'Bitmain Antminer S21 XP', 90, 5900, 0.0026, 312, 312, true, 'most_popular', 2, 'Professional Bitcoin mining with 500 TH/s over 90 days.', 0.000250, 0.00750, 0.09125, 0.00675, 455),
('Elite SHA-256', 'Elite SHA-256', 'elite-sha256', 'Bitcoin', 'SHA-256', 1000, 'TH/s', 'MicroBT Whatsminer M60', 180, 11200, 0.0025, 156, 156, false, 'best_value', 3, 'High-performance 1 PH/s equivalent Bitcoin mining contract.', 0.000500, 0.01500, 0.18250, 0.02700, 1822),
('Industrial PH', 'Industrial PH', 'industrial-ph', 'Bitcoin', 'SHA-256', 1, 'PH/s', 'MicroBT Whatsminer M60S', 365, 10500, 0.0024, 89, 89, true, 'featured', 4, 'Full petahash mining contract for serious investors.', 0.000520, 0.01560, 0.18980, 0.18980, 12803),
('Scrypt Lite', 'Scrypt Lite', 'scrypt-lite', 'Litecoin', 'Scrypt', 200, 'MH/s', 'Bitmain Antminer L9', 90, 1680, 0.002, 523, 523, false, null, 5, 'Litecoin mining with Scrypt algorithm.', 0.000120, 0.00360, 0.04380, 0.01080, 728),
('Kaspa Boost', 'Kaspa Boost', 'kaspa-boost', 'Kaspa', 'KHeavyHash', 500, 'GH/s', 'IceRiver KS3', 180, 3600, 0.0018, 201, 201, false, null, 6, 'High-efficiency Kaspa mining with KHeavyHash algorithm.', 0.000080, 0.00240, 0.02920, 0.01440, 971);

-- ─── Payment Methods: extend with new columns ─────────────────────────────────
ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS logo_url            text,
  ADD COLUMN IF NOT EXISTS coin_symbol         text,
  ADD COLUMN IF NOT EXISTS network             text,
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS memo_supported      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS memo_label          text,
  ADD COLUMN IF NOT EXISTS min_deposit         numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_deposit         numeric,
  ADD COLUMN IF NOT EXISTS min_withdrawal      numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_withdrawal      numeric,
  ADD COLUMN IF NOT EXISTS daily_limit         numeric,
  ADD COLUMN IF NOT EXISTS deposit_fee         numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawal_fee      numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS network_fee         numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS required_confirmations integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS auto_deposit        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_withdrawal     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recommended      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_maintenance      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_provider        text,
  ADD COLUMN IF NOT EXISTS api_endpoint        text,
  ADD COLUMN IF NOT EXISTS webhook_url         text,
  ADD COLUMN IF NOT EXISTS extra_addresses     jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Update existing payment methods with coin symbols
UPDATE payment_methods SET coin_symbol = currency, network = network_tag WHERE coin_symbol IS NULL;

-- Ensure RLS for payment_methods allows admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'payment_methods_admin_all'
  ) THEN
    CREATE POLICY "payment_methods_admin_all" ON payment_methods
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- Also add more crypto methods if not already present
INSERT INTO payment_methods (currency, direction, mode, display_name, network_tag, coin_symbol, network, sort_order, is_active)
SELECT v.currency, v.direction, 'manual', v.display_name, v.network_tag, v.currency, v.network_tag, v.sort_order, false
FROM (VALUES
  ('LTC',  'deposit',    'Litecoin (LTC)',          'Litecoin Network',  10),
  ('LTC',  'withdrawal', 'Litecoin (LTC)',          'Litecoin Network',  10),
  ('DOGE', 'deposit',    'Dogecoin (DOGE)',          'Dogecoin Network',  11),
  ('DOGE', 'withdrawal', 'Dogecoin (DOGE)',          'Dogecoin Network',  11),
  ('SOL',  'deposit',    'Solana (SOL)',             'Solana Network',    12),
  ('SOL',  'withdrawal', 'Solana (SOL)',             'Solana Network',    12),
  ('TRX',  'deposit',    'TRON (TRX)',               'TRON Network',      13),
  ('TRX',  'withdrawal', 'TRON (TRX)',               'TRON Network',      13),
  ('BNB',  'deposit',    'BNB Chain (BNB)',          'BSC Network',       14),
  ('BNB',  'withdrawal', 'BNB Chain (BNB)',          'BSC Network',       14),
  ('XRP',  'deposit',    'Ripple (XRP)',             'XRP Ledger',        15),
  ('XRP',  'withdrawal', 'Ripple (XRP)',             'XRP Ledger',        15),
  ('KAS',  'deposit',    'Kaspa (KAS)',              'Kaspa Network',     16),
  ('KAS',  'withdrawal', 'Kaspa (KAS)',              'Kaspa Network',     16),
  ('XMR',  'deposit',    'Monero (XMR)',             'Monero Network',    17),
  ('XMR',  'withdrawal', 'Monero (XMR)',             'Monero Network',    17),
  ('USDC', 'deposit',    'USD Coin (USDC)',          'ERC-20',            18),
  ('USDC', 'withdrawal', 'USD Coin (USDC)',          'ERC-20',            18)
) AS v(currency, direction, display_name, network_tag, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods pm WHERE pm.currency = v.currency AND pm.direction = v.direction
);

-- Update XRP to support memo/tag
UPDATE payment_methods SET memo_supported = true, memo_label = 'Destination Tag' WHERE currency = 'XRP';
UPDATE payment_methods SET memo_supported = true, memo_label = 'Memo' WHERE currency IN ('XLM', 'BNB');
