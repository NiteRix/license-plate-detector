# Supabase Image Storage Setup

This guide explains how to set up and use Supabase Storage for storing plate detection images.

## What is Supabase Storage?

Supabase Storage is a file storage service that allows you to store images, documents, and other files. It's perfect for storing the plate detection images captured by your app.

## Setup Steps

### Step 1: Run the Bucket Migration

1. Go to your Supabase project → **SQL Editor**
2. Create a new query
3. Copy and paste the SQL from `supabase/migrations/002_create_storage_bucket.sql`
4. Click **Run**

This creates a public storage bucket named `plate-images`.

### Step 2: Run the Policies Migration

1. In the same SQL Editor, create a new query
2. Copy and paste the SQL from `supabase/migrations/004_storage_policies_sql.sql`
3. Click **Run**

This creates all the necessary policies for uploading, viewing, and deleting images.

### Step 3: Verify the Setup

1. In Supabase, go to **Storage**
2. You should see a bucket named `plate-images`
3. Click on it and go to **Policies** tab
4. You should see 5 policies listed:
   - authenticated_users_can_upload
   - public_can_view_images
   - authenticated_can_view_images
   - authenticated_users_can_delete
   - authenticated_users_can_update

### Step 4: Test the Setup

1. Go back to your app
2. Upload a plate image
3. Click "Sync to Cloud"
4. Check Supabase Storage to verify the image was uploaded

## How It Works

### Automatic Image Upload

When you detect a plate:

1. The image is saved locally first (for instant access)
2. When syncing to Supabase, the image is automatically uploaded to Storage
3. The image URL is stored in the database
4. You can access the image from anywhere using the public URL

### Image Organization

Images are organized by user ID:

```
plate-images/
├── user-id-1/
│   ├── 1702000000000-abc123.jpg
│   ├── 1702000001000-def456.jpg
│   └── ...
├── user-id-2/
│   ├── 1702000002000-ghi789.jpg
│   └── ...
```

## API Usage

### Upload an Image

```typescript
import { imageStorage } from "@/lib/image-storage";

const imageUrl = await imageStorage.uploadImage(file, userId);
```

### Delete an Image

```typescript
await imageStorage.deleteImage(imageUrl);
```

### Get a Signed URL (for private images)

```typescript
const signedUrl = await imageStorage.getSignedUrl(filePath, 3600);
```

### List User's Images

```typescript
const images = await imageStorage.listUserImages(userId);
```

### Compress Image Before Upload

```typescript
const compressedBlob = await imageStorage.compressImage(
  file,
  1920, // max width
  1080, // max height
  0.8 // quality (0-1)
);
const imageUrl = await imageStorage.uploadImage(compressedBlob, userId);
```

## Storage Limits

- **Free Tier**: 1 GB total storage
- **Pro Tier**: 100 GB total storage
- **File Size Limit**: 5 GB per file

## Image URL Format

Public images are accessible at:

```
https://fgizbvvyitjgfcfyhwoo.supabase.co/storage/v1/object/public/plate-images/user-id/timestamp-random.jpg
```

## Security

- Images are organized by user ID
- Only authenticated users can upload
- Users can delete and update their own images
- Public read access (images are viewable by anyone with the URL)

## Troubleshooting

### "Bucket not found"

Make sure you ran the migration SQL to create the bucket.

### "Permission denied" or "RLS policy violation"

Make sure you ran the policies migration SQL from `supabase/migrations/004_storage_policies_sql.sql`.

### Images not uploading

1. Check browser console for errors
2. Verify the bucket exists in Supabase Storage
3. Verify the policies are set up correctly
4. Check that your user is authenticated

## Making Images Private (Optional)

To make images private instead of public, modify the policies to require authentication for SELECT operations.

## Next Steps

1. Test uploading an image through the app
2. Verify it appears in Supabase Storage
3. Check that the image URL is stored in the database
4. Try accessing the image URL in a browser
