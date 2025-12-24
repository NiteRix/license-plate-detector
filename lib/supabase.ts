import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Credentials not configured. Database features will be disabled.')
} else {
    console.log('[Supabase] Configured with URL:', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
})

// Helper to check if Supabase is properly configured
export const isSupabaseReady = () => {
    return !!supabaseUrl && !!supabaseAnonKey
}

// Helper to check authentication status
export const checkAuth = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
            console.error('[Supabase] Auth check error:', error)
            return { authenticated: false, user: null, error: error.message }
        }
        return { authenticated: !!user, user, error: null }
    } catch (error: any) {
        console.error('[Supabase] Auth check exception:', error)
        return { authenticated: false, user: null, error: error.message }
    }
}

export type Database = {
    public: {
        Tables: {
            plates: {
                Row: {
                    id: string
                    user_id: string
                    plate_number: string
                    timestamp: string
                    image_url: string
                    confidence: number
                    letters: string
                    numbers: string
                    bbox: number[] | null
                    notes: string | null
                    location: string | null
                    vehicle_type: string | null
                    is_verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    plate_number: string
                    timestamp: string
                    image_url: string
                    confidence: number
                    letters: string
                    numbers: string
                    bbox?: number[] | null
                    notes?: string | null
                    location?: string | null
                    vehicle_type?: string | null
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    plate_number?: string
                    timestamp?: string
                    image_url?: string
                    confidence?: number
                    letters?: string
                    numbers?: string
                    bbox?: number[] | null
                    notes?: string | null
                    location?: string | null
                    vehicle_type?: string | null
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
