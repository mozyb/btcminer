-- Add missing maintenance_fee_rate column to contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS maintenance_fee_rate numeric(10,6) NOT NULL DEFAULT 0.0028;

-- Create a dedicated RPC for crediting mining rewards that avoids double-transaction
-- (admin_adjust_balance inserts a 'deposit' type tx; this one inserts 'mining_reward')
CREATE OR REPLACE FUNCTION public.credit_mining_reward(
  p_user_id    uuid,
  p_currency   text,
  p_amount     numeric,
  p_usd_value  numeric DEFAULT 0,
  p_note       text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Ensure wallet row exists
  INSERT INTO public.wallets (user_id, currency, symbol, balance)
    VALUES (p_user_id, p_currency, p_currency, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;

  -- Credit wallet balance
  UPDATE public.wallets
     SET balance    = balance + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id AND currency = p_currency;

  -- Insert single mining_reward transaction (not deposit)
  INSERT INTO public.transactions (
    user_id, type, currency, amount, usd_value, status, note
  ) VALUES (
    p_user_id,
    'mining_reward',
    p_currency,
    p_amount,
    p_usd_value,
    'confirmed',
    COALESCE(p_note, 'Daily mining reward')
  );
END;
$$;