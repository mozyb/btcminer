
-- DB function: approve deposit → upsert wallet balance + mark completed
CREATE OR REPLACE FUNCTION approve_deposit(tx_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tx RECORD;
BEGIN
  -- Load transaction
  SELECT * INTO tx FROM public.transactions WHERE id = tx_id AND type = 'deposit';
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF tx.status != 'pending' THEN RAISE EXCEPTION 'Transaction is not pending'; END IF;

  -- Mark completed
  UPDATE public.transactions SET status = 'completed' WHERE id = tx_id;

  -- Upsert wallet: increment balance
  INSERT INTO public.wallets (user_id, currency, symbol, balance, address)
  VALUES (
    tx.user_id,
    tx.currency,
    CASE tx.currency
      WHEN 'BTC'  THEN 'BTC'
      WHEN 'ETH'  THEN 'ETH'
      WHEN 'USDT' THEN 'USDT'
      WHEN 'LTC'  THEN 'LTC'
      WHEN 'DOGE' THEN 'DOGE'
      ELSE tx.currency
    END,
    tx.amount,
    ''
  )
  ON CONFLICT (user_id, currency)
  DO UPDATE SET balance = public.wallets.balance + EXCLUDED.balance;
END;
$$;

-- DB function: approve withdrawal → deduct wallet balance + mark completed
CREATE OR REPLACE FUNCTION approve_withdrawal(tx_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tx RECORD;
  cur_balance NUMERIC;
BEGIN
  SELECT * INTO tx FROM public.transactions WHERE id = tx_id AND type = 'withdrawal';
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF tx.status != 'pending' THEN RAISE EXCEPTION 'Transaction is not pending'; END IF;

  -- Check balance
  SELECT balance INTO cur_balance FROM public.wallets WHERE user_id = tx.user_id AND currency = tx.currency;
  IF cur_balance IS NULL OR cur_balance < tx.amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Mark completed
  UPDATE public.transactions SET status = 'completed' WHERE id = tx_id;

  -- Deduct from wallet
  UPDATE public.wallets SET balance = balance - tx.amount
  WHERE user_id = tx.user_id AND currency = tx.currency;
END;
$$;

-- DB function: reject withdrawal → just mark failed (no balance change; balance not yet deducted)
CREATE OR REPLACE FUNCTION reject_transaction(tx_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.transactions SET status = 'failed' WHERE id = tx_id AND status = 'pending';
END;
$$;

-- Add unique constraint on wallets (user_id, currency) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wallets' AND constraint_name = 'wallets_user_id_currency_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_currency_key UNIQUE (user_id, currency);
  END IF;
END $$;
