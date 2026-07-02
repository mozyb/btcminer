
-- Allow authenticated users to insert their own transactions (manual deposit/withdrawal requests)
CREATE POLICY "Users insert own transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
