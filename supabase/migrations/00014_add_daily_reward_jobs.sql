
-- ── daily_reward_jobs: log every scheduled run ─────────────────────────────
CREATE TABLE daily_reward_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date         date NOT NULL,
  status           text NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  btc_price        numeric(18,2),
  network_hashrate numeric(18,6),  -- EH/s
  network_difficulty numeric(18,6),-- T
  block_reward     numeric(18,8) DEFAULT 3.125,
  contracts_processed integer DEFAULT 0,
  total_btc_credited  numeric(18,8) DEFAULT 0,
  error_message    text,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- unique: one job per calendar day
CREATE UNIQUE INDEX daily_reward_jobs_run_date_idx ON daily_reward_jobs(run_date);

-- ── reward_credits: per-contract credit records ─────────────────────────────
CREATE TABLE reward_credits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       uuid NOT NULL REFERENCES daily_reward_jobs(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id  uuid NOT NULL,
  btc_amount   numeric(18,8) NOT NULL,
  usd_value    numeric(18,2),
  network_hashrate numeric(18,6),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reward_credits_user_idx     ON reward_credits(user_id);
CREATE INDEX reward_credits_job_idx      ON reward_credits(job_id);
CREATE INDEX reward_credits_contract_idx ON reward_credits(contract_id);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE daily_reward_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_credits    ENABLE ROW LEVEL SECURITY;

-- admin: full access on daily_reward_jobs
CREATE POLICY "admin_all_reward_jobs" ON daily_reward_jobs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- admin: full access on reward_credits
CREATE POLICY "admin_all_reward_credits" ON reward_credits
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- users: view own reward credits
CREATE POLICY "user_select_own_reward_credits" ON reward_credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
