# Supabase Integration Setup Guide

This guide will help you set up Supabase for cloud storage of your plate detection data.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Your project name (e.g., "PlateDetect")
   - **Database Password**: Create a strong password
   - **Region**: Choose the region closest to you
4. Click "Create new project" and wait for it to initialize

## Step 2: Get Your Credentials

1. Once your project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Step 3: Create the Database Table

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Paste the following SQL:

```sql
-- Create plates table
CREATE TABLE plates (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  image_url TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  letters TEXT NOT NULL,
  numbers TEXT NOT NULL,
  bbox FLOAT8[] NULL,
  notes TEXT NULL,
  location TEXT NULL,
  vehicle_type TEXT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_plates_user_id ON plates(user_id);
CREATE INDEX idx_plates_timestamp ON plates(timestamp DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own plates
CREATE POLICY "Users can view their own plates"
  ON plates FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own plates
CREATE POLICY "Users can insert their own plates"
  ON plates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own plates
CREATE POLICY "Users can update their own plates"
  ON plates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own plates
CREATE POLICY "Users can delete their own plates"
  ON plates FOR DELETE
  USING (auth.uid() = user_id);
```

4. Click **Run** to execute the SQL

## Step 4: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Restart your development server for the changes to take effect

## Step 5: Update Authentication (Optional)

To use Supabase authentication instead of mock credentials:

1. In Supabase, go to **Authentication** → **Providers**
2. Enable the authentication methods you want (Email, Google, GitHub, etc.)
3. Update `components/login-form.tsx` to use Supabase auth:

```typescript
import { supabase } from "@/lib/supabase";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;
    onLogin(email, user.user_metadata?.name || email);
  } catch (error: any) {
    setError(error.message || "Invalid email or password");
  } finally {
    setIsLoading(false);
  }
};
```

## How It Works

### Hybrid Storage Architecture

Your app now uses a **hybrid storage system**:

1. **Local Storage (Primary)**: Data is saved to browser's localStorage immediately for instant access
2. **Supabase (Secondary)**: Data is synced to Supabase in the background

### Benefits

- ✅ **Offline Support**: Works without internet connection
- ✅ **Fast**: Instant local access to data
- ✅ **Reliable**: Automatic cloud backup
- ✅ **Sync**: Automatic background synchronization
- ✅ **Multi-device**: Access your data from any device

### Sync Behavior

- **New plates**: Automatically synced to Supabase after detection
- **Updates**: Changes are synced in the background
- **Deletions**: Removed from both local and cloud storage
- **Manual sync**: Click "Sync to Cloud" button to force sync unsynced items
- **On load**: Dashboard automatically syncs with Supabase on startup

## Troubleshooting

### "Supabase credentials not configured"

This warning appears if environment variables are not set. Either:

- Set up Supabase and add credentials to `.env.local`
- Or continue using local storage only (no cloud sync)

### Sync failures

Check the browser console for error messages. Common issues:

- User not authenticated
- Network connection issues
- Supabase project not initialized

### Data not syncing

1. Check that Supabase credentials are correct in `.env.local`
2. Verify the `plates` table exists in your Supabase project
3. Check browser console for errors
4. Click "Sync to Cloud" button to manually trigger sync

## Storage Limits

- **Local Storage**: ~5-10MB per browser (varies by browser)
- **Supabase**: Depends on your plan (free tier has generous limits)

For large image storage, consider using Supabase Storage (separate from the database).

## Next Steps

1. Set up Supabase Storage for image files (optional)
2. Implement Supabase authentication
3. Add real-time sync using Supabase subscriptions
4. Set up automated backups
