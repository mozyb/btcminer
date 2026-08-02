CREATE OR REPLACE FUNCTION public.increment_promotion_redemption(promo_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.promotions
  SET redemptions_count = COALESCE(redemptions_count, 0) + 1,
      updated_at = now()
  WHERE id = promo_id;
$$;