
CREATE OR REPLACE FUNCTION increment_contract_reward(
  p_contract_id uuid,
  p_amount      numeric
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE contracts
  SET rewards_generated = COALESCE(rewards_generated, 0) + p_amount
  WHERE id = p_contract_id;
END;
$$;
