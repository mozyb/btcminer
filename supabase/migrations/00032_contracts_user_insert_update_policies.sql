-- Allow users to insert their own contracts (purchase)
CREATE POLICY "Users can insert own contracts"
  ON public.contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own contracts (needed for reward tracking)
CREATE POLICY "Users can update own contracts"
  ON public.contracts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());