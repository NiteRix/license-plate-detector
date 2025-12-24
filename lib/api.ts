export interface PlateDetectionResponse {
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

interface FlaskPlateResponse {
  count: number
  plates: Array<{
    bbox: number[]
    raw_text: string[]
    letters: string
    numbers: string
  }>
}

// Configuration
const API_CONFIG = {
  baseUrl: "http://192.168.1.4:8080",
  timeout: 120000, // 2 minutes timeout (model can be slow)
  maxRetries: 2,
  retryDelay: 1000, // 1 second between retries
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = API_CONFIG.maxRetries,
  timeout: number = API_CONFIG.timeout
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[API] Attempt ${attempt + 1}/${maxRetries + 1}...`)

      const response = await fetchWithTimeout(url, options, timeout)
      return response
    } catch (error: any) {
      lastError = error

      // Check if it's an abort error (timeout)
      if (error.name === 'AbortError') {
        console.warn(`[API] Request timed out after ${timeout / 1000}s`)
        error.message = `Request timed out after ${timeout / 1000} seconds. The model might be processing a complex image.`
      }

      // Don't retry on certain errors
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        console.error('[API] Network error - server might be down')
        throw new Error('Cannot connect to the detection server. Please make sure the Flask API is running.')
      }

      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        console.log(`[API] Retrying in ${API_CONFIG.retryDelay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay))
      }
    }
  }

  throw lastError || new Error('Request failed after all retries')
}

export async function detectPlate(imageFile: File | Blob | any): Promise<PlateDetectionResponse> {
  try {
    console.log("[API] Sending image to Flask API at", API_CONFIG.baseUrl)
    console.log("[API] Timeout:", API_CONFIG.timeout / 1000, "seconds")
    console.log("[API] Max retries:", API_CONFIG.maxRetries)

    // Validate and convert input to proper File/Blob
    let actualFile: File | Blob

    if (!imageFile) {
      throw new Error("No image file provided")
    }

    // Handle different input types
    if (imageFile instanceof File) {
      actualFile = imageFile
      console.log("[API] Using File directly:", {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
      })
    } else if (imageFile instanceof Blob) {
      actualFile = imageFile
      console.log("[API] Using Blob directly:", {
        size: imageFile.size,
        type: imageFile.type,
      })
    } else if (typeof imageFile === 'string') {
      throw new Error("String input not supported. Please use File or Blob object.")
    } else if (imageFile.target && imageFile.target.result) {
      const result = imageFile.target.result
      if (typeof result === 'string' && result.startsWith('data:')) {
        const response = await fetch(result)
        actualFile = await response.blob()
        console.log("[API] Converted data URL to Blob:", {
          size: actualFile.size,
          type: actualFile.type,
        })
      } else {
        throw new Error("Unsupported FileReader result format")
      }
    } else {
      throw new Error(`Unsupported input type: ${typeof imageFile}. Expected File or Blob object.`)
    }

    if (actualFile.size === 0) {
      throw new Error("Image file is empty")
    }

    if (actualFile.size > 10 * 1024 * 1024) {
      throw new Error("Image file is too large (max 10MB)")
    }

    // Create FormData
    const formData = new FormData()
    if (actualFile instanceof File) {
      formData.append('image', actualFile, actualFile.name)
    } else {
      formData.append('image', actualFile, 'image.jpg')
    }

    console.log("[API] FormData created, making request...")

    // Make request with timeout and retry
    const response = await fetchWithRetry(
      `${API_CONFIG.baseUrl}/detect`,
      {
        method: "POST",
        body: formData,
      }
    )

    console.log("[API] Response status:", response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `Flask API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        }
      } catch {
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        } catch {
          // Ignore
        }
      }
      throw new Error(errorMessage)
    }

    const data: FlaskPlateResponse = await response.json()
    console.log("[API] Response from Flask API:", data)

    // Handle case where no plates are detected
    if (data.count === 0 || !data.plates || data.plates.length === 0) {
      return {
        id: Date.now().toString(),
        plateNumber: "NO_PLATE_DETECTED",
        timestamp: new Date().toISOString(),
        imageUrl: URL.createObjectURL(actualFile),
        confidence: 0,
        letters: "",
        numbers: "",
      }
    }

    // Use the first detected plate
    const firstPlate = data.plates[0]
    const plateNumber = `${firstPlate.letters} ${firstPlate.numbers}`.trim() || "UNKNOWN"

    return {
      id: Date.now().toString(),
      plateNumber: plateNumber,
      timestamp: new Date().toISOString(),
      imageUrl: URL.createObjectURL(actualFile),
      confidence: 0.95,
      letters: firstPlate.letters,
      numbers: firstPlate.numbers,
      bbox: firstPlate.bbox,
    }
  } catch (error) {
    console.error("[API] Error detecting plate:", error)
    throw error
  }
}

// Helper function to convert various input types to File/Blob
async function convertToFileOrBlob(input: any): Promise<File | Blob> {
  if (input instanceof File || input instanceof Blob) {
    return input
  }

  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      const response = await fetch(input)
      return await response.blob()
    } else if (input.startsWith('http')) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      return await response.blob()
    }
  }

  if (input && input.target && input.target.result) {
    return convertToFileOrBlob(input.target.result)
  }

  throw new Error(`Cannot convert input to File or Blob: ${typeof input}`)
}

// Alternative function for URL-based detection
export async function detectPlateFromUrl(imageUrl: string): Promise<PlateDetectionResponse> {
  try {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBlob = await imageResponse.blob()
    const imageFile = new File([imageBlob], 'image.jpg', { type: imageBlob.type })

    const result = await detectPlate(imageFile)

    return {
      ...result,
      imageUrl: imageUrl,
    }
  } catch (error) {
    console.error("[API] Error detecting plate from URL:", error)
    throw error
  }
}

// Flexible function that can handle File, Blob, data URL, or regular URL
export async function detectPlateFromAny(input: File | Blob | string | any): Promise<PlateDetectionResponse> {
  try {
    const fileOrBlob = await convertToFileOrBlob(input)
    return await detectPlate(fileOrBlob)
  } catch (error) {
    console.error("[API] Error in detectPlateFromAny:", error)
    throw error
  }
}

/**
 * Update API configuration at runtime
 */
export function updateApiConfig(config: Partial<typeof API_CONFIG>) {
  Object.assign(API_CONFIG, config)
  console.log("[API] Config updated:", API_CONFIG)
}

/**
 * Get current API configuration
 */
export function getApiConfig() {
  return { ...API_CONFIG }
}
