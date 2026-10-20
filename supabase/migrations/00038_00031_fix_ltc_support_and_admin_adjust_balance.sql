-- 1. Upgrade approve_deposit to support all currencies (BTC, ETH, USDT, LTC, DOGE, etc.)
CREATE OR REPLACE FUNCTION public.approve_deposit(tx_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_amount numeric;
  v_currency text;
  v_sym text;
BEGIN
  SELECT user_id, amount, UPPER(currency) INTO v_user_id, v_amount, v_currency
    FROM public.transactions WHERE id = tx_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found: %', tx_id;
  END IF;

  v_sym := CASE v_currency
    WHEN 'BTC'  THEN 'BTC'
    WHEN 'ETH'  THEN 'ETH'
    WHEN 'USDT' THEN 'USDT'
    WHEN 'LTC'  THEN 'LTC'
    WHEN 'DOGE' THEN 'DOGE'
    ELSE v_currency
  END;

  INSERT INTO public.wallets (user_id, currency, symbol, balance, updated_at)
    VALUES (v_user_id, v_currency, v_sym, v_amount, now())
    ON CONFLICT (user_id, currency)
    DO UPDATE SET balance    = wallets.balance + EXCLUDED.balance,
                  updated_at = now();

  UPDATE public.transactions SET status = 'confirmed' WHERE id = tx_id;
END;
$$;

-- 2. Upgrade admin_adjust_balance with full currency normalization & error handling
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id   uuid,
  p_currency  text,
  p_amount    numeric,   -- positive = top-up, negative = debit
  p_note      text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance numeric;
  v_currency text;
  v_sym text;
BEGIN
  v_currency := UPPER(TRIM(p_currency));
  v_sym := CASE v_currency
    WHEN 'BTC'  THEN 'BTC'
    WHEN 'ETH'  THEN 'ETH'
    WHEN 'USDT' THEN 'USDT'
    WHEN 'LTC'  THEN 'LTC'
    WHEN 'DOGE' THEN 'DOGE'
    ELSE v_currency
  END;

  -- Ensure wallet row exists
  INSERT INTO public.wallets (user_id, currency, symbol, balance, updated_at)
    VALUES (p_user_id, v_currency, v_sym, 0, now())
    ON CONFLICT (user_id, currency) DO NOTHING;

  -- Check sufficient balance for debits
  IF p_amount < 0 THEN
    SELECT balance INTO v_balance
      FROM public.wallets
     WHERE user_id = p_user_id AND currency = v_currency;
    IF COALESCE(v_balance, 0) + p_amount < 0 THEN
      RAISE EXCEPTION 'Insufficient balance: have %, debit %', COALESCE(v_balance, 0), ABS(p_amount);
    END IF;
  END IF;

  -- Apply adjustment
  UPDATE public.wallets
     SET balance    = balance + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id AND currency = v_currency;

  -- Record as admin transaction
  INSERT INTO public.transactions (
    user_id, type, currency, amount, usd_value, status, note
  ) VALUES (
    p_user_id,
    CASE WHEN p_amount >= 0 THEN 'deposit' ELSE 'withdrawal' END,
    v_currency,
    ABS(p_amount),
    0,
    'confirmed',
    COALESCE(p_note, CASE WHEN p_amount >= 0 THEN 'Admin top-up (' || v_currency || ')' ELSE 'Admin debit (' || v_currency || ')' END)
  );
END;
$$;

-- 3. Update create_default_wallets trigger to include LTC and DOGE
CREATE OR REPLACE FUNCTION public.create_default_wallets()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, currency, symbol, balance)
  VALUES
    (NEW.id, 'BTC',  'BTC',  0),
    (NEW.id, 'ETH',  'ETH',  0),
    (NEW.id, 'LTC',  'LTC',  0),
    (NEW.id, 'USDT', 'USDT', 0),
    (NEW.id, 'DOGE', 'DOGE', 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Backfill default LTC and DOGE wallets for existing users
INSERT INTO public.wallets (user_id, currency, symbol, balance)
SELECT p.id, c.currency, c.currency, 0
FROM public.profiles p
CROSS JOIN (VALUES ('BTC'), ('ETH'), ('LTC'), ('USDT'), ('DOGE')) AS c(currency)
ON CONFLICT (user_id, currency) DO NOTHING;
