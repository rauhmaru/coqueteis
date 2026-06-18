
CREATE POLICY "drink images read" ON storage.objects FOR SELECT USING (bucket_id = 'drink-images');
CREATE POLICY "drink images insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'drink-images');
CREATE POLICY "drink images update" ON storage.objects FOR UPDATE USING (bucket_id = 'drink-images');
CREATE POLICY "drink images delete" ON storage.objects FOR DELETE USING (bucket_id = 'drink-images');
