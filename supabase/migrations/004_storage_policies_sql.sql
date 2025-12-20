-- Storage Policies for plate-images bucket
-- This SQL creates all necessary policies for the storage bucket

-- First, make sure RLS is enabled on storage.objects
-- (This is usually already enabled by default in Supabase)

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "authenticated_users_can_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plate-images'
);

-- Policy 2: Allow public to view/read images
CREATE POLICY "public_can_view_images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'plate-images'
);

-- Policy 3: Allow authenticated users to view images
CREATE POLICY "authenticated_can_view_images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'plate-images'
);

-- Policy 4: Allow authenticated users to delete images
CREATE POLICY "authenticated_users_can_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'plate-images'
);

-- Policy 5: Allow authenticated users to update images
CREATE POLICY "authenticated_users_can_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'plate-images'
)
WITH CHECK (
  bucket_id = 'plate-images'
);
