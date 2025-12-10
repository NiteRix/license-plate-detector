interface PlateDetectionResponse {
  id: string
  plateNumber: string
  timestamp: string
  imageUrl: string
  confidence: number
  letters: string
  numbers: string
  bbox?: number[]
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

export async function detectPlate(imageFile: File | Blob | any): Promise<PlateDetectionResponse> {
  try {
    console.log("[v0] Sending image to Flask API at http://127.0.0.1:8080/detect")
    console.log("[v0] Input type:", typeof imageFile)
    console.log("[v0] Input constructor:", imageFile?.constructor?.name)
    console.log("[v0] Is File:", imageFile instanceof File)
    console.log("[v0] Is Blob:", imageFile instanceof Blob)

    // Validate and convert input to proper File/Blob
    let actualFile: File | Blob;

    if (!imageFile) {
      throw new Error("No image file provided")
    }

    // Handle different input types
    if (imageFile instanceof File) {
      actualFile = imageFile;
      console.log("[v0] Using File directly:", {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
      });
    } else if (imageFile instanceof Blob) {
      actualFile = imageFile;
      console.log("[v0] Using Blob directly:", {
        size: imageFile.size,
        type: imageFile.type,
      });
    } else if (typeof imageFile === 'string') {
      // If it's a base64 string or data URL, convert it
      throw new Error("String input not supported. Please use File or Blob object.");
    } else if (imageFile.target && imageFile.target.result) {
      // Handle FileReader result
      const result = imageFile.target.result;
      if (typeof result === 'string' && result.startsWith('data:')) {
        // Convert data URL to blob
        const response = await fetch(result);
        actualFile = await response.blob();
        console.log("[v0] Converted data URL to Blob:", {
          size: actualFile.size,
          type: actualFile.type,
        });
      } else {
        throw new Error("Unsupported FileReader result format");
      }
    } else {
      throw new Error(`Unsupported input type: ${typeof imageFile}. Expected File or Blob object.`);
    }

    if (actualFile.size === 0) {
      throw new Error("Image file is empty")
    }

    if (actualFile.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error("Image file is too large (max 10MB)")
    }

    // Create FormData to send the image file
    const formData = new FormData()

    // Use different approaches based on file type
    if (actualFile instanceof File) {
      formData.append('image', actualFile, actualFile.name)
    } else {
      // For Blob, provide a default filename
      formData.append('image', actualFile, 'image.jpg')
    }

    console.log("[v0] FormData created, making request...")

    const response = await fetch("http://192.168.1.4:8080/detect", {
      method: "POST",
      body: formData, // No Content-Type header needed, browser sets it automatically for FormData
    })

    console.log("[v0] Response status:", response.status, response.statusText)

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `Flask API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        }
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        } catch (e2) {
          // Ignore if we can't read the response
        }
      }
      throw new Error(errorMessage)
    }

    const data: FlaskPlateResponse = await response.json()
    console.log("[v0] Response from Flask API:", data)

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
      confidence: 0.95, // Flask API doesn't return confidence, using default
      letters: firstPlate.letters,
      numbers: firstPlate.numbers,
      bbox: firstPlate.bbox,
    }
  } catch (error) {
    console.error("[v0] Error detecting plate:", error)
    throw error
  }
}

// Helper function to convert various input types to File/Blob
async function convertToFileOrBlob(input: any): Promise<File | Blob> {
  if (input instanceof File || input instanceof Blob) {
    return input;
  }

  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      // Data URL
      const response = await fetch(input);
      return await response.blob();
    } else if (input.startsWith('http')) {
      // Regular URL
      const response = await fetch(input);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      return await response.blob();
    }
  }

  if (input && input.target && input.target.result) {
    // FileReader result
    return convertToFileOrBlob(input.target.result);
  }

  throw new Error(`Cannot convert input to File or Blob: ${typeof input}`);
}

// Alternative function for URL-based detection (if you need to fetch image from URL first)
export async function detectPlateFromUrl(imageUrl: string): Promise<PlateDetectionResponse> {
  try {
    // Fetch the image from URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBlob = await imageResponse.blob()
    const imageFile = new File([imageBlob], 'image.jpg', { type: imageBlob.type })

    // Use the main detection function
    const result = await detectPlate(imageFile)

    // Override the imageUrl with the original URL
    return {
      ...result,
      imageUrl: imageUrl,
    }
  } catch (error) {
    console.error("[v0] Error detecting plate from URL:", error)
    throw error
  }
}

// Flexible function that can handle File, Blob, data URL, or regular URL
export async function detectPlateFromAny(input: File | Blob | string | any): Promise<PlateDetectionResponse> {
  try {
    const fileOrBlob = await convertToFileOrBlob(input);
    return await detectPlate(fileOrBlob);
  } catch (error) {
    console.error("[v0] Error in detectPlateFromAny:", error);
    throw error;
  }
}
