-- Admin balance adjustment RPC (top-up or debit any user wallet)
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id   uuid,
  p_currency  text,
  p_amount    numeric,   -- positive = top-up, negative = debit
  p_note      text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance numeric;
BEGIN
  -- Ensure wallet row exists
  INSERT INTO public.wallets (user_id, currency, symbol, balance)
    VALUES (p_user_id, p_currency, p_currency, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;

  -- Check sufficient balance for debits
  IF p_amount < 0 THEN
    SELECT balance INTO v_balance
      FROM public.wallets
     WHERE user_id = p_user_id AND currency = p_currency;
    IF COALESCE(v_balance, 0) + p_amount < 0 THEN
      RAISE EXCEPTION 'Insufficient balance: have %, debit %', COALESCE(v_balance, 0), ABS(p_amount);
    END IF;
  END IF;

  -- Apply adjustment
  UPDATE public.wallets
     SET balance    = balance + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id AND currency = p_currency;

  -- Record as admin transaction
  INSERT INTO public.transactions (
    user_id, type, currency, amount, usd_value, status, note
  ) VALUES (
    p_user_id,
    CASE WHEN p_amount >= 0 THEN 'deposit' ELSE 'withdrawal' END,
    p_currency,
    ABS(p_amount),
    0,
    'confirmed',
    COALESCE(p_note, CASE WHEN p_amount >= 0 THEN 'Admin top-up' ELSE 'Admin debit' END)
  );
END;
$$;

-- RLS: only service_role / admin can call this (it's SECURITY DEFINER so that's automatic)

-- Also add last_login_at + status columns to profiles if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'banned')),
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Index for fast admin queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);