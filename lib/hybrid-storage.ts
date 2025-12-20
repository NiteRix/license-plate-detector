import { supabase } from './supabase'
import { imageStorage } from './image-storage'

export interface DetectedPlate {
    id: string
    plateNumber: string
    timestamp: string
    imageUrl: string
    imageStoragePath?: string
    confidence: number
    letters: string
    numbers: string
    bbox?: number[]
    notes?: string
    location?: string
    vehicleType?: string
    isVerified?: boolean
    userId?: string
    syncedToSupabase?: boolean
}

const STORAGE_KEY = 'plateDetect_plates'
const SYNC_STATUS_KEY = 'plateDetect_syncStatus'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export const hybridStorage = {
    // Get all plates (from local storage, with sync status)
    getPlates(): DetectedPlate[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            return stored ? JSON.parse(stored) : []
        } catch (error) {
            console.error('Error reading plates from localStorage:', error)
            return []
        }
    },

    // Save plates to localStorage
    savePlates(plates: DetectedPlate[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(plates))
        } catch (error) {
            console.error('Error saving plates to localStorage:', error)
        }
    },

    // Add a new plate (to local storage immediately, sync to Supabase in background)
    addPlate(plate: DetectedPlate): DetectedPlate[] {
        const plates = this.getPlates()
        const newPlate = {
            ...plate,
            syncedToSupabase: false,
        }
        const newPlates = [newPlate, ...plates]
        this.savePlates(newPlates)

        // Sync to Supabase in background if configured
        if (isSupabaseConfigured()) {
            this.syncPlateToSupabase(newPlate).catch(error => {
                console.error('Failed to sync plate to Supabase:', error)
            })
        }

        return newPlates
    },

    // Update an existing plate
    updatePlate(plateId: string, updates: Partial<DetectedPlate>): DetectedPlate[] {
        const plates = this.getPlates()
        const updatedPlates = plates.map(plate => {
            if (plate.id === plateId) {
                return {
                    ...plate,
                    ...updates,
                    syncedToSupabase: false, // Mark as needing sync
                }
            }
            return plate
        })
        this.savePlates(updatedPlates)

        // Sync to Supabase in background if configured
        if (isSupabaseConfigured()) {
            const updatedPlate = updatedPlates.find(p => p.id === plateId)
            if (updatedPlate) {
                this.syncPlateToSupabase(updatedPlate).catch(error => {
                    console.error('Failed to sync plate update to Supabase:', error)
                })
            }
        }

        return updatedPlates
    },

    // Delete a plate
    deletePlate(plateId: string): DetectedPlate[] {
        const plates = this.getPlates()
        const filteredPlates = plates.filter(plate => plate.id !== plateId)
        this.savePlates(filteredPlates)

        // Delete from Supabase in background if configured
        if (isSupabaseConfigured()) {
            this.deletePlateFromSupabase(plateId).catch(error => {
                console.error('Failed to delete plate from Supabase:', error)
            })
        }

        return filteredPlates
    },

    // Clear all plates
    clearAllPlates(): void {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(SYNC_STATUS_KEY)
    },

    // Clear all plates from Supabase
    async clearAllPlatesFromSupabase(): Promise<void> {
        if (!isSupabaseConfigured()) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.warn('User not authenticated, skipping Supabase clear')
                return
            }

            // Get all plates for this user
            const { data, error: fetchError } = await supabase
                .from('plates')
                .select('id, image_url')
                .eq('user_id', user.id)

            if (fetchError) throw fetchError

            // Delete all images from storage
            if (data && data.length > 0) {
                for (const plate of data) {
                    try {
                        if (plate.image_url && plate.image_url.includes('supabase')) {
                            await imageStorage.deleteImage(plate.image_url)
                        }
                    } catch (error) {
                        console.warn('Failed to delete image:', error)
                    }
                }
            }

            // Delete all plates from database
            const { error: deleteError } = await supabase
                .from('plates')
                .delete()
                .eq('user_id', user.id)

            if (deleteError) throw deleteError

            console.log('All plates cleared from Supabase')
        } catch (error) {
            console.error('Error clearing plates from Supabase:', error)
            throw error
        }
    },

    // Export plates as JSON
    exportPlates(): string {
        const plates = this.getPlates()
        return JSON.stringify(plates, null, 2)
    },

    // Import plates from JSON
    importPlates(jsonData: string): DetectedPlate[] {
        try {
            const importedPlates = JSON.parse(jsonData)
            if (Array.isArray(importedPlates)) {
                const platesWithSyncFlag = importedPlates.map(plate => ({
                    ...plate,
                    syncedToSupabase: false,
                }))
                this.savePlates(platesWithSyncFlag)
                return platesWithSyncFlag
            } else {
                throw new Error('Invalid data format')
            }
        } catch (error) {
            console.error('Error importing plates:', error)
            throw error
        }
    },

    // Supabase sync functions
    async syncPlateToSupabase(plate: DetectedPlate): Promise<void> {
        if (!isSupabaseConfigured()) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.warn('User not authenticated, skipping Supabase sync')
                return
            }

            let imageUrl = plate.imageUrl
            let imageStoragePath = plate.imageStoragePath

            // Upload image to Supabase Storage if it's a local blob URL
            if (imageUrl.startsWith('blob:') && !imageStoragePath) {
                try {
                    const response = await fetch(imageUrl)
                    const blob = await response.blob()
                    imageUrl = await imageStorage.uploadImage(blob, user.id)
                    imageStoragePath = imageUrl
                } catch (error) {
                    console.warn('Failed to upload image to storage, using local URL:', error)
                }
            }

            const plateData = {
                id: plate.id,
                user_id: user.id,
                plate_number: plate.plateNumber,
                timestamp: plate.timestamp,
                image_url: imageUrl,
                confidence: plate.confidence,
                letters: plate.letters,
                numbers: plate.numbers,
                bbox: plate.bbox || null,
                notes: plate.notes || null,
                location: plate.location || null,
                vehicle_type: plate.vehicleType || null,
                is_verified: plate.isVerified || false,
            }

            const { error } = await supabase
                .from('plates')
                .upsert(plateData, { onConflict: 'id' })

            if (error) throw error

            // Mark as synced in local storage
            const plates = this.getPlates()
            const updatedPlates = plates.map(p =>
                p.id === plate.id ? { ...p, syncedToSupabase: true, imageStoragePath } : p
            )
            this.savePlates(updatedPlates)
        } catch (error) {
            console.error('Error syncing plate to Supabase:', error)
            throw error
        }
    },

    async deletePlateFromSupabase(plateId: string): Promise<void> {
        if (!isSupabaseConfigured()) return

        try {
            // Get the plate to find the image URL
            const plates = this.getPlates()
            const plate = plates.find(p => p.id === plateId)

            // Delete image from storage if it exists
            if (plate?.imageUrl) {
                try {
                    // Check if it's a Supabase storage URL
                    if (plate.imageUrl.includes('supabase') || plate.imageUrl.includes('plate-images')) {
                        console.log('Attempting to delete image:', plate.imageUrl)
                        await imageStorage.deleteImage(plate.imageUrl)
                        console.log('Image deleted successfully')
                    }
                } catch (error) {
                    console.warn('Failed to delete image from storage:', error)
                    // Continue with database deletion even if image deletion fails
                }
            }

            // Delete from database
            const { error } = await supabase
                .from('plates')
                .delete()
                .eq('id', plateId)

            if (error) {
                throw new Error(`Database delete failed: ${error.message}`)
            }

            console.log('Plate deleted successfully from database')
        } catch (error) {
            console.error('Error deleting plate from Supabase:', error)
            throw error
        }
    },

    // Fetch plates from Supabase and merge with local storage
    async syncFromSupabase(): Promise<DetectedPlate[]> {
        if (!isSupabaseConfigured()) {
            return this.getPlates()
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.warn('User not authenticated, using local storage only')
                return this.getPlates()
            }

            const { data, error } = await supabase
                .from('plates')
                .select('*')
                .eq('user_id', user.id)
                .order('timestamp', { ascending: false })

            if (error) throw error

            // Convert Supabase format to local format
            const supabasePlates: DetectedPlate[] = (data || []).map(plate => ({
                id: plate.id,
                plateNumber: plate.plate_number,
                timestamp: plate.timestamp,
                imageUrl: plate.image_url,
                confidence: plate.confidence,
                letters: plate.letters,
                numbers: plate.numbers,
                bbox: plate.bbox,
                notes: plate.notes,
                location: plate.location,
                vehicleType: plate.vehicle_type,
                isVerified: plate.is_verified,
                userId: plate.user_id,
                syncedToSupabase: true,
            }))

            // Merge with local plates (local takes precedence for unsynced items)
            const localPlates = this.getPlates()
            const mergedPlates = this.mergePlates(localPlates, supabasePlates)
            this.savePlates(mergedPlates)

            return mergedPlates
        } catch (error) {
            console.error('Error syncing from Supabase:', error)
            // Return local plates if sync fails
            return this.getPlates()
        }
    },

    // Merge local and Supabase plates
    private mergePlates(localPlates: DetectedPlate[], supabasePlates: DetectedPlate[]): DetectedPlate[] {
        const plateMap = new Map<string, DetectedPlate>()

        // Add Supabase plates first
        supabasePlates.forEach(plate => {
            plateMap.set(plate.id, plate)
        })

        // Override with local unsynced plates
        localPlates.forEach(plate => {
            if (!plate.syncedToSupabase) {
                plateMap.set(plate.id, plate)
            }
        })

        return Array.from(plateMap.values()).sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    },

    // Sync all unsynced plates to Supabase
    async syncAllUnsynced(): Promise<void> {
        if (!isSupabaseConfigured()) return

        const plates = this.getPlates()
        const unsyncedPlates = plates.filter(p => !p.syncedToSupabase)

        for (const plate of unsyncedPlates) {
            try {
                await this.syncPlateToSupabase(plate)
            } catch (error) {
                console.error(`Failed to sync plate ${plate.id}:`, error)
            }
        }
    },
}
