
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for kyc-documents storage
CREATE POLICY "Users upload own KYC docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = 'kyc' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users read own KYC docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = 'kyc' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Admins access all KYC docs"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'kyc-documents' AND get_user_role(auth.uid()) = 'admin');
