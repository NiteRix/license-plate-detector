import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Database features will be disabled.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
