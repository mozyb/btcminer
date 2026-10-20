-- 1. Add updated_at to wallets
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Back-fill existing rows
UPDATE public.wallets SET updated_at = created_at WHERE updated_at = now();

-- 3. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_wallet_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON public.wallets;
CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

-- 4. Fix approve_deposit: now sets updated_at via trigger automatically,
--    but we also write it explicitly for clarity
CREATE OR REPLACE FUNCTION public.approve_deposit(tx_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_currency text;
BEGIN
  SELECT user_id, amount, currency INTO v_user_id, v_amount, v_currency
    FROM public.transactions WHERE id = tx_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Transaction not found: %', tx_id; END IF;

  INSERT INTO public.wallets (user_id, currency, symbol, balance)
    VALUES (v_user_id, v_currency, v_currency, v_amount)
    ON CONFLICT (user_id, currency)
    DO UPDATE SET balance    = wallets.balance + EXCLUDED.balance,
                  updated_at = now();

  UPDATE public.transactions SET status = 'confirmed' WHERE id = tx_id;
END;
$$;

-- 5. Fix approve_withdrawal: now sets updated_at
CREATE OR REPLACE FUNCTION public.approve_withdrawal(tx_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_currency text; v_balance numeric;
BEGIN
  SELECT user_id, amount, currency INTO v_user_id, v_amount, v_currency
    FROM public.transactions WHERE id = tx_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Transaction not found: %', tx_id; END IF;

  SELECT balance INTO v_balance FROM public.wallets
    WHERE user_id = v_user_id AND currency = v_currency;
  IF v_balance IS NULL OR v_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient balance: have %, need %', COALESCE(v_balance, 0), v_amount;
  END IF;

  UPDATE public.wallets
     SET balance    = balance - v_amount,
         updated_at = now()
   WHERE user_id = v_user_id AND currency = v_currency;

  UPDATE public.transactions SET status = 'confirmed' WHERE id = tx_id;
END;
$$;

-- 6. Trigger function: create default BTC, ETH, USDT wallets on new profile
CREATE OR REPLACE FUNCTION public.create_default_wallets()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, currency, symbol, balance)
  VALUES
    (NEW.id, 'BTC',  'BTC',  0),
    (NEW.id, 'ETH',  'ETH',  0),
    (NEW.id, 'USDT', 'USDT', 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_default_wallets ON public.profiles;
CREATE TRIGGER trg_create_default_wallets
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_wallets();

-- 7. Back-fill wallets for existing users who don't have them yet
INSERT INTO public.wallets (user_id, currency, symbol, balance)
SELECT p.id, c.currency, c.currency, 0
FROM public.profiles p
CROSS JOIN (VALUES ('BTC'), ('ETH'), ('USDT')) AS c(currency)
ON CONFLICT (user_id, currency) DO NOTHING;