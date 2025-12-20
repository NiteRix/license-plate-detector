# Fixing Storage Upload Error: Row Level Security Policy

If you're getting the error `new row violates row-level security policy` when uploading images, follow these steps.

## The Problem

Supabase Storage has Row Level Security (RLS) enabled, which requires policies to be set up before you can upload files.

## Quick Fix (Recommended for Development)

### Option 1: Disable RLS (Easiest for Testing)

1. Go to your Supabase project
2. Navigate to **Storage** → **plate-images**
3. Click the **Policies** tab
4. Look for the toggle that says "RLS is enabled"
5. Click it to **disable RLS**
6. Try uploading again

This allows anyone to upload/download/delete files. Good for development, but not recommended for production.

### Option 2: Set Up Proper Policies (Recommended for Production)

1. Go to **Storage** → **plate-images** → **Policies**
2. Make sure RLS is **enabled**
3. Click **New Policy** and create these 4 policies:

#### Policy 1: Allow Authenticated Users to Upload

- **Name**: "Users can upload"
- **Type**: INSERT
- **Target roles**: authenticated
- **USING expression**: Leave blank (or use `true`)
- **WITH CHECK expression**: `(bucket_id = 'plate-images')`

#### Policy 2: Allow Public to View Images

- **Name**: "Public can view"
- **Type**: SELECT
- **Target roles**: public, authenticated
- **USING expression**: `(bucket_id = 'plate-images')`

#### Policy 3: Allow Users to Delete

- **Name**: "Users can delete"
- **Type**: DELETE
- **Target roles**: authenticated
- **USING expression**: `(bucket_id = 'plate-images')`

#### Policy 4: Allow Users to Update

- **Name**: "Users can update"
- **Type**: UPDATE
- **Target roles**: authenticated
- **USING expression**: `(bucket_id = 'plate-images')`
- **WITH CHECK expression**: `(bucket_id = 'plate-images')`

## Verification

After setting up policies:

1. Go back to your app
2. Upload a plate image
3. Click "Sync to Cloud"
4. Check Supabase Storage to verify the image was uploaded

## Troubleshooting

### Still getting RLS error?

1. **Check RLS is enabled**: Go to Storage > plate-images > Policies. You should see "RLS is enabled"
2. **Verify policies exist**: You should see 4 policies listed
3. **Check user is authenticated**: Make sure you're logged in to the app
4. **Try disabling RLS temporarily**: To test if policies are the issue

### Images not appearing in Storage?

1. Refresh the Storage page
2. Check that you're in the correct bucket (plate-images)
3. Check that you're looking in the correct folder (should be organized by user ID)

### Can't create policies?

1. Make sure you're the project owner
2. Try refreshing the page
3. Check that the bucket exists first

## For Production

For a production app, use Option 2 (proper policies) with these additional considerations:

1. **Add owner checks**: Modify policies to only allow users to delete/update their own files
2. **Use signed URLs**: For sensitive images, use signed URLs instead of public URLs
3. **Enable backups**: Set up automated backups in Supabase
4. **Monitor storage**: Set up alerts for storage usage

## Code Changes (If Needed)

If you're still having issues, you can temporarily disable image uploads in the code:

In `lib/hybrid-storage.ts`, modify `syncPlateToSupabase()`:

```typescript
// Skip image upload if having RLS issues
if (imageUrl.startsWith("blob:") && !imageStoragePath) {
  try {
    // Temporarily skip image upload
    console.warn("Image upload skipped due to RLS issues");
    // await imageStorage.uploadImage(blob, user.id)
  } catch (error) {
    console.warn("Failed to upload image:", error);
  }
}
```

This will let you test the rest of the functionality while you fix the RLS policies.
