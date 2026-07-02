-- Create storage bucket for farm images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('farm-images', 'farm-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public read policy for farm images
CREATE POLICY "farm_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'farm-images');

-- Service role can upload
CREATE POLICY "farm_images_service_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'farm-images');

CREATE POLICY "farm_images_service_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'farm-images');

CREATE POLICY "farm_images_service_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'farm-images');