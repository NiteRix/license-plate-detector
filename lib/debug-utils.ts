import { supabase, isSupabaseReady, checkAuth } from './supabase'
import { imageStorage } from './image-storage'

/**
 * Debug utility to check the entire upload pipeline
 */
export const debugUploadPipeline = async () => {
    const results: Record<string, any> = {}

    console.log('=== DEBUG: Upload Pipeline Check ===')

    // 1. Check Supabase configuration
    console.log('\n1. Checking Supabase configuration...')
    results.supabaseConfigured = isSupabaseReady()
    console.log('   Supabase configured:', results.supabaseConfigured)

    if (!results.supabaseConfigured) {
        console.error('   ❌ Supabase not configured. Check .env.local file.')
        return results
    }
    console.log('   ✅ Supabase configured')

    // 2. Check authentication
    console.log('\n2. Checking authentication...')
    const authResult = await checkAuth()
    results.authenticated = authResult.authenticated
    results.userId = authResult.user?.id
    results.authError = authResult.error

    if (!authResult.authenticated) {
        console.error('   ❌ Not authenticated:', authResult.error)
        return results
    }
    console.log('   ✅ Authenticated as:', authResult.user?.email)

    // 3. Check storage bucket access
    console.log('\n3. Checking storage bucket access...')
    const bucketResult = await imageStorage.checkBucketAccess()
    results.bucketExists = bucketResult.exists
    results.canUpload = bucketResult.canUpload
    results.bucketError = bucketResult.error

    if (!bucketResult.exists) {
        console.error('   ❌ Bucket not found. Run migration SQL.')
        return results
    }
    if (!bucketResult.canUpload) {
        console.error('   ❌ Cannot upload to bucket:', bucketResult.error)
        console.error('   Run the storage policies SQL migration.')
        return results
    }
    console.log('   ✅ Bucket accessible')

    // 4. Check database table access
    console.log('\n4. Checking database table access...')
    try {
        const { data, error } = await supabase
            .from('plates')
            .select('id')
            .limit(1)

        if (error) {
            results.databaseAccessible = false
            results.databaseError = error.message
            console.error('   ❌ Database error:', error.message)
        } else {
            results.databaseAccessible = true
            console.log('   ✅ Database accessible')
        }
    } catch (error: any) {
        results.databaseAccessible = false
        results.databaseError = error.message
        console.error('   ❌ Database exception:', error.message)
    }

    // 5. Test image upload (with a tiny test image)
    console.log('\n5. Testing image upload...')
    try {
        // Create a tiny test image (1x1 pixel PNG)
        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        const testBlob = await fetch(`data:image/png;base64,${testImageData}`).then(r => r.blob())

        const testUrl = await imageStorage.uploadImage(testBlob, authResult.user!.id)
        results.uploadTest = 'success'
        results.testImageUrl = testUrl
        console.log('   ✅ Test upload successful:', testUrl)

        // Clean up test image
        try {
            await imageStorage.deleteImage(testUrl)
            console.log('   ✅ Test image cleaned up')
        } catch (e) {
            console.warn('   ⚠️ Could not clean up test image')
        }
    } catch (error: any) {
        results.uploadTest = 'failed'
        results.uploadError = error.message
        console.error('   ❌ Upload test failed:', error.message)
    }

    console.log('\n=== DEBUG: Results ===')
    console.log(JSON.stringify(results, null, 2))

    return results
}

/**
 * Quick check for common issues
 */
export const quickDiagnose = async (): Promise<string[]> => {
    const issues: string[] = []

    // Check Supabase config
    if (!isSupabaseReady()) {
        issues.push('Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
        return issues
    }

    // Check auth
    const auth = await checkAuth()
    if (!auth.authenticated) {
        issues.push('Not logged in. Please sign in first.')
        return issues
    }

    // Check bucket
    const bucket = await imageStorage.checkBucketAccess()
    if (!bucket.exists) {
        issues.push('Storage bucket "plate-images" not found. Run: supabase/migrations/002_create_storage_bucket.sql')
    }
    if (bucket.exists && !bucket.canUpload) {
        issues.push('Storage policies not set up. Run: supabase/migrations/004_storage_policies_sql.sql')
    }

    // Check database
    try {
        const { error } = await supabase.from('plates').select('id').limit(1)
        if (error) {
            issues.push(`Database error: ${error.message}. Run: supabase/migrations/001_create_plates_table.sql`)
        }
    } catch (e: any) {
        issues.push(`Database connection failed: ${e.message}`)
    }

    if (issues.length === 0) {
        issues.push('✅ All checks passed! Upload should work.')
    }

    return issues
}

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
    (window as any).debugUpload = debugUploadPipeline;
    (window as any).quickDiagnose = quickDiagnose;
}
