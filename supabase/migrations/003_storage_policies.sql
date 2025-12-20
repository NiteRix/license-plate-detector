-- Storage Policies for plate-images bucket
-- These policies need to be created through the Supabase dashboard
-- Go to: Storage > plate-images > Policies

-- IMPORTANT: Make sure RLS is ENABLED on the bucket first!
-- Then create these policies:

-- Policy 1: Allow authenticated users to upload images
-- Type: INSERT
-- Target roles: authenticated
-- USING expression: Leave empty or use: true
-- WITH CHECK expression: (bucket_id = 'plate-images')

-- Policy 2: Allow public to view/read images
-- Type: SELECT
-- Target roles: public, authenticated
-- USING expression: (bucket_id = 'plate-images')

-- Policy 3: Allow authenticated users to delete their own images
-- Type: DELETE
-- Target roles: authenticated
-- USING expression: (bucket_id = 'plate-images')

-- Policy 4: Allow authenticated users to update their own images
-- Type: UPDATE
-- Target roles: authenticated
-- USING expression: (bucket_id = 'plate-images')
-- WITH CHECK expression: (bucket_id = 'plate-images')

-- QUICK SETUP (if policies don't work):
-- 1. Go to Storage > plate-images
-- 2. Click "Policies" tab
-- 3. If no policies exist, click "Enable RLS" first
-- 4. Then create policies with the expressions above
-- 5. If still having issues, temporarily disable RLS to test uploads
