// Local storage utilities for plate detection data

export interface DetectedPlate {
    id: string
    plateNumber: string
    timestamp: string
    imageUrl: string
    confidence: number
    letters: string
    numbers: string
    bbox?: number[]
    // Additional editable fields
    notes?: string
    location?: string
    vehicleType?: string
    isVerified?: boolean
}

const STORAGE_KEY = 'plateDetect_plates'

export const plateStorage = {
    // Get all plates from localStorage
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

    // Add a new plate
    addPlate(plate: DetectedPlate): DetectedPlate[] {
        const plates = this.getPlates()
        const newPlates = [plate, ...plates]
        this.savePlates(newPlates)
        return newPlates
    },

    // Update an existing plate
    updatePlate(plateId: string, updates: Partial<DetectedPlate>): DetectedPlate[] {
        const plates = this.getPlates()
        const updatedPlates = plates.map(plate =>
            plate.id === plateId ? { ...plate, ...updates } : plate
        )
        this.savePlates(updatedPlates)
        return updatedPlates
    },

    // Delete a plate
    deletePlate(plateId: string): DetectedPlate[] {
        const plates = this.getPlates()
        const filteredPlates = plates.filter(plate => plate.id !== plateId)
        this.savePlates(filteredPlates)
        return filteredPlates
    },

    // Clear all plates
    clearAllPlates(): void {
        localStorage.removeItem(STORAGE_KEY)
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
                this.savePlates(importedPlates)
                return importedPlates
            } else {
                throw new Error('Invalid data format')
            }
        } catch (error) {
            console.error('Error importing plates:', error)
            throw error
        }
    }
}