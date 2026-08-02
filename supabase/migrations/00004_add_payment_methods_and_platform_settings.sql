
-- ── payment_methods: admin controls manual vs automatic per currency+direction ──
CREATE TABLE public.payment_methods (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency      text NOT NULL,                        -- BTC, ETH, USDT, LTC, DOGE
  direction     text NOT NULL CHECK (direction IN ('deposit','withdrawal')),
  mode          text NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual','automatic')),
  display_name  text NOT NULL,
  instructions  text,                                 -- shown to user in manual mode
  admin_address text,                                 -- wallet address for deposits (manual)
  network_tag   text,                                 -- e.g. ERC-20, TRC-20
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (currency, direction)
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access payment_methods"
  ON public.payment_methods FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated users read active payment_methods"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Anon users read active payment_methods"
  ON public.payment_methods FOR SELECT
  TO anon
  USING (is_active = true);

-- ── platform_settings: key-value store for admin-editable settings ──
CREATE TABLE public.platform_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  label      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access platform_settings"
  ON public.platform_settings FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated users read platform_settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- ── Seed default payment methods ──
INSERT INTO public.payment_methods (currency, direction, mode, display_name, instructions, admin_address, network_tag, sort_order) VALUES
  ('BTC',  'deposit',    'manual', 'Bitcoin (BTC)',            'Send BTC to the address shown below. Your balance will be credited within 1–3 hours after admin review.', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'Bitcoin Network',      1),
  ('ETH',  'deposit',    'manual', 'Ethereum (ETH)',           'Send ETH to the address shown below. Your balance will be credited within 1–3 hours after admin review.', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'ERC-20',            2),
  ('USDT', 'deposit',    'manual', 'Tether USD (USDT)',        'Send USDT to the address shown below. Your balance will be credited within 1–3 hours after admin review.', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', 'TRC-20',             3),
  ('LTC',  'deposit',    'manual', 'Litecoin (LTC)',           'Send LTC to the address shown below. Your balance will be credited within 1–3 hours after admin review.', 'LcFsGrGaHBE6SX5fT94Kb8mVGiGYPNPMeq', 'Litecoin Network',   4),
  ('DOGE', 'deposit',    'manual', 'Dogecoin (DOGE)',          'Send DOGE to the address shown below. Your balance will be credited within 1–3 hours after admin review.', 'D8vFHz2LpPZzYEiGCY9ePQHUXPYKSBxfEh', 'Dogecoin Network',   5),
  ('BTC',  'withdrawal', 'manual', 'Bitcoin (BTC)',            'Submit your withdrawal request. Admin will process and send funds to your wallet within 1–24 hours.', NULL, 'Bitcoin Network',    1),
  ('ETH',  'withdrawal', 'manual', 'Ethereum (ETH)',           'Submit your withdrawal request. Admin will process and send funds to your wallet within 1–24 hours.', NULL, 'ERC-20',            2),
  ('USDT', 'withdrawal', 'manual', 'Tether USD (USDT)',        'Submit your withdrawal request. Admin will process and send funds to your wallet within 1–24 hours.', NULL, 'TRC-20',             3),
  ('LTC',  'withdrawal', 'manual', 'Litecoin (LTC)',           'Submit your withdrawal request. Admin will process and send funds to your wallet within 1–24 hours.', NULL, 'Litecoin Network',  4),
  ('DOGE', 'withdrawal', 'manual', 'Dogecoin (DOGE)',          'Submit your withdrawal request. Admin will process and send funds to your wallet within 1–24 hours.', NULL, 'Dogecoin Network',  5);

-- ── Seed platform settings ──
INSERT INTO public.platform_settings (key, value, label) VALUES
  ('admin_email',    'admin@btcminer.online', 'Admin Notification Email'),
  ('platform_name',  'BTCMiner.online',       'Platform Name'),
  ('support_email',  'support@btcminer.online', 'Support Email');

-- ── add payment_method_id to transactions ──
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id),
  ADD COLUMN IF NOT EXISTS destination_address text;
