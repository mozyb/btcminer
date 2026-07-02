
-- ── 1. Mining Pools table ────────────────────────────────────────────────────
CREATE TABLE mining_pools (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  url           text NOT NULL DEFAULT '',
  algorithm     text NOT NULL DEFAULT 'SHA-256',
  fee           numeric NOT NULL DEFAULT 1.0,      -- %
  min_payout    numeric NOT NULL DEFAULT 0.001,
  uptime        numeric NOT NULL DEFAULT 99.5,     -- %
  location      text NOT NULL DEFAULT '',
  hashrate_eh   numeric NOT NULL DEFAULT 0,        -- EH/s
  workers       integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mining_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mining_pools" ON mining_pools FOR SELECT USING (true);
CREATE POLICY "Service full access mining_pools" ON mining_pools USING (auth.role() = 'service_role');

-- ── 2. Add mining_pool_id + mining_farm_id to contracts ─────────────────────
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS mining_pool_id uuid REFERENCES mining_pools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mining_farm_id uuid REFERENCES mining_farms(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id    uuid REFERENCES contract_templates(id) ON DELETE SET NULL;

-- ── 3. Fix email_providers: set correct provider_type + from_email ───────────
UPDATE email_providers
SET
  provider_type = 'resend',
  from_email    = 'noreply@btcminer.online',
  from_name     = 'BTCMiner.online',
  updated_at    = now()
WHERE name = 'resend';

-- ── 4. Seed mining pools ─────────────────────────────────────────────────────
INSERT INTO mining_pools (name, url, algorithm, fee, min_payout, uptime, location, hashrate_eh, workers, sort_order) VALUES
  ('Foundry USA Pool',    'https://foundrydigital.com',    'SHA-256',  0.00, 0.005, 99.9, 'United States',  180.0, 130000, 1),
  ('AntPool',             'https://www.antpool.com',       'SHA-256',  1.00, 0.001, 99.7, 'China / Global', 140.0, 105000, 2),
  ('F2Pool',              'https://www.f2pool.com',        'SHA-256',  2.50, 0.001, 99.5, 'China / Global', 110.0,  90000, 3),
  ('ViaBTC',              'https://www.viabtc.com',        'SHA-256',  2.00, 0.001, 99.3, 'China / Global',  80.0,  65000, 4),
  ('Braiins Pool',        'https://braiins.com/pool',      'SHA-256',  2.00, 0.001, 99.8, 'Czech Republic',  50.0,  40000, 5),
  ('BTCMiner Pool',       'https://btcminer.online/pool',  'SHA-256',  1.50, 0.001, 99.9, 'Global',          10.0,   8000, 6),
  ('LitecoinPool',        'https://www.litecoinpool.org',  'Scrypt',   1.00, 0.01,  99.6, 'Global',           5.0,  12000, 7),
  ('K1Pool',              'https://k1pool.com',            'KHeavyHash',1.00, 1.0,  99.5, 'United States',    3.0,   5000, 8);

-- ── 5. Fix contract_templates: recalculate derived fields correctly ───────────
-- Starter SHA-256: 100 TH/s, 30d, daily=0.00009 BTC (realistic ~$97 at $1.08M/BTC)
UPDATE contract_templates SET
  estimated_monthly_reward  = ROUND(0.00009 * 30,  8),    -- 0.00270000
  estimated_annual_reward   = ROUND(0.00009 * 365, 8),    -- 0.03285000
  estimated_btc_production  = ROUND(0.00009 * 30,  8),    -- 0.00270000 (duration × daily)
  estimated_usd_value       = ROUND(0.00009 * 30 * 97000, 2)  -- ~261.90
WHERE name = 'Starter SHA-256' AND hashrate = 100 AND duration = 30;

-- Delete duplicate copy
DELETE FROM contract_templates WHERE name = 'Starter SHA-256 (Copy)';

-- Pro SHA-256: 500 TH/s, 90d, daily=0.000250 BTC
UPDATE contract_templates SET
  estimated_monthly_reward  = ROUND(0.000250 * 30,  8),   -- 0.00750000
  estimated_annual_reward   = ROUND(0.000250 * 365, 8),   -- 0.09125000
  estimated_btc_production  = ROUND(0.000250 * 90,  8),   -- 0.02250000
  estimated_usd_value       = ROUND(0.000250 * 90 * 97000, 2)  -- ~2182.50
WHERE name = 'Pro SHA-256';

-- Elite SHA-256: 1000 TH/s, 180d, daily=0.000500 BTC
UPDATE contract_templates SET
  estimated_monthly_reward  = ROUND(0.000500 * 30,  8),   -- 0.01500000
  estimated_annual_reward   = ROUND(0.000500 * 365, 8),   -- 0.18250000
  estimated_btc_production  = ROUND(0.000500 * 180, 8),   -- 0.09000000
  estimated_usd_value       = ROUND(0.000500 * 180 * 97000, 2)  -- ~8730.00
WHERE name = 'Elite SHA-256';

-- Industrial PH: 1 PH/s = 1000 TH/s, 365d, daily=0.000520 BTC (conservative for network growth)
UPDATE contract_templates SET
  estimated_monthly_reward  = ROUND(0.000520 * 30,  8),   -- 0.01560000
  estimated_annual_reward   = ROUND(0.000520 * 365, 8),   -- 0.18980000
  estimated_btc_production  = ROUND(0.000520 * 365, 8),   -- 0.18980000
  estimated_usd_value       = ROUND(0.000520 * 365 * 97000, 2)  -- ~18410.60
WHERE name = 'Industrial PH';

-- Scrypt Lite: 200 MH/s Litecoin, 90d
UPDATE contract_templates SET
  estimated_monthly_reward  = ROUND(0.000120 * 30,  8),   -- 0.00360000
  estimated_annual_reward   = ROUND(0.000120 * 365, 8),   -- 0.04380000
  estimated_btc_production  = ROUND(0.000120 * 90,  8),   -- 0.01080000
  estimated_usd_value       = ROUND(0.000120 * 90 * 97000, 2)  -- ~1047.60
WHERE name = 'Scrypt Lite';

-- Kaspa Boost: 500 GH/s Kaspa, 180d
UPDATE contract_templates SET
  estimated_monthly_reward  = ROUND(0.000080 * 30,  8),   -- 0.00240000
  estimated_annual_reward   = ROUND(0.000080 * 365, 8),   -- 0.02920000
  estimated_btc_production  = ROUND(0.000080 * 180, 8),   -- 0.01440000
  estimated_usd_value       = ROUND(0.000080 * 180 * 97000, 2)  -- ~1396.80
WHERE name = 'Kaspa Boost';
