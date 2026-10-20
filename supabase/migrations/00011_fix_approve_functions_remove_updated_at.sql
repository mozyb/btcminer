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
    DO UPDATE SET balance = wallets.balance + EXCLUDED.balance;

  UPDATE public.transactions SET status = 'confirmed' WHERE id = tx_id;
END;
$$;

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

  UPDATE public.wallets SET balance = balance - v_amount
    WHERE user_id = v_user_id AND currency = v_currency;

  UPDATE public.transactions SET status = 'confirmed' WHERE id = tx_id;
END;
$$;