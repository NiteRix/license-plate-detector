import { supabase } from './supabase'

const BUCKET_NAME = 'plate-images'

export const imageStorage = {
    /**
     * Upload an image file to Supabase Storage
     * @param file - The image file to upload
     * @param userId - The user ID (for organizing files)
     * @returns The public URL of the uploaded image
     */
    async uploadImage(file: File | Blob, userId: string): Promise<string> {
        try {
            if (!file) {
                throw new Error('No file provided')
            }

            // Generate a unique filename
            const timestamp = Date.now()
            const random = Math.random().toString(36).substring(2, 8)
            const filename = `${userId}/${timestamp}-${random}.jpg`

            // Upload the file
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filename, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (error) {
                throw new Error(`Upload failed: ${error.message}`)
            }

            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(data.path)

            return publicUrlData.publicUrl
        } catch (error) {
            console.error('Error uploading image:', error)
            throw error
        }
    },

    /**
     * Delete an image from Supabase Storage
     * @param imageUrl - The public URL of the image
     */
    async deleteImage(imageUrl: string): Promise<void> {
        try {
            let filePath: string

            // Try different URL formats
            if (imageUrl.includes('/storage/v1/object/public/plate-images/')) {
                const urlParts = imageUrl.split('/storage/v1/object/public/plate-images/')
                if (urlParts.length < 2) {
                    throw new Error('Invalid image URL format')
                }
                filePath = decodeURIComponent(urlParts[1])
            } else if (imageUrl.includes('plate-images/')) {
                // Handle alternative URL format
                const urlParts = imageUrl.split('plate-images/')
                if (urlParts.length < 2) {
                    throw new Error('Invalid image URL format')
                }
                filePath = decodeURIComponent(urlParts[1])
            } else {
                throw new Error('URL does not contain plate-images path')
            }

            console.log('Deleting image from path:', filePath)

            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([filePath])

            if (error) {
                throw new Error(`Delete failed: ${error.message}`)
            }

            console.log('Image deleted successfully:', filePath)
        } catch (error) {
            console.error('Error deleting image:', error)
            throw error
        }
    },

    /**
     * Get a signed URL for an image (useful for private images)
     * @param filePath - The file path in storage
     * @param expiresIn - Expiration time in seconds (default: 3600)
     */
    async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(filePath, expiresIn)

            if (error) {
                throw new Error(`Failed to get signed URL: ${error.message}`)
            }

            return data.signedUrl
        } catch (error) {
            console.error('Error getting signed URL:', error)
            throw error
        }
    },

    /**
     * List all images for a user
     * @param userId - The user ID
     */
    async listUserImages(userId: string): Promise<Array<{ name: string; id: string; created_at: string }>> {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .list(userId, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                })

            if (error) {
                throw new Error(`Failed to list images: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error listing images:', error)
            throw error
        }
    },

    /**
     * Get the public URL for a file path
     * @param filePath - The file path in storage
     */
    getPublicUrl(filePath: string): string {
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath)

        return data.publicUrl
    },

    /**
     * Convert a File/Blob to base64 for preview
     * @param file - The file to convert
     */
    async fileToBase64(file: File | Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    },

    /**
     * Compress an image before upload
     * @param file - The image file
     * @param maxWidth - Maximum width in pixels
     * @param maxHeight - Maximum height in pixels
     * @param quality - JPEG quality (0-1)
     */
    async compressImage(
        file: File | Blob,
        maxWidth: number = 1920,
        maxHeight: number = 1080,
        quality: number = 0.8
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (event) => {
                const img = new Image()

                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width)
                            width = maxWidth
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height)
                            height = maxHeight
                        }
                    }

                    canvas.width = width
                    canvas.height = height

                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'))
                        return
                    }

                    ctx.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob)
                            } else {
                                reject(new Error('Failed to compress image'))
                            }
                        },
                        'image/jpeg',
                        quality
                    )
                }

                img.onerror = () => reject(new Error('Failed to load image'))
                img.src = event.target?.result as string
            }

            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
        })
    },
}
