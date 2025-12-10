"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Camera, Loader2 } from "lucide-react"
import { detectPlate } from "@/lib/api"

interface PlateUploaderProps {
  onPlateDetected: (plate: any) => void
}

export default function PlateUploader({ onPlateDetected }: PlateUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      setIsMobile(isMobileDevice)
    }
    checkMobile()
  }, [])

  const processImage = async (file: File) => {
    setIsLoading(true)
    try {
      // Create preview URL for display
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Call API to detect plate using the actual File object
      const result = await detectPlate(file)
      onPlateDetected(result)

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl)
      setPreview(null)
    } catch (error) {
      console.error("Error processing image:", error)
      // Clean up preview URL on error
      if (preview) {
        URL.revokeObjectURL(preview)
      }
      setPreview(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const startCamera = async () => {
    setCameraError(null)

    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    if (!isSecure) {
      setCameraError("Camera access requires HTTPS. Please use the file upload instead.")
      return
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera not supported on this device. Please use file upload.")
      return
    }

    try {
      // Mobile-optimized camera constraints
      const constraints = {
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16 / 9 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
        setCameraError(null)
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err)
      let errorMessage = "Camera access failed. "

      if (err.name === 'NotAllowedError') {
        errorMessage += "Please allow camera permissions and try again."
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera found on this device."
      } else if (err.name === 'NotSupportedError') {
        errorMessage += "Camera not supported on this device."
      } else {
        errorMessage += "Please use file upload instead."
      }

      setCameraError(errorMessage)
    }
  }

  // Mobile-friendly camera function using native input
  const openMobileCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const imageUrl = canvasRef.current.toDataURL("image/jpeg")
        setPreview(imageUrl)
        stopCamera()

        // Create a file from canvas
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "plate-capture.jpg", { type: "image/jpeg" })
            processImage(file)
          }
        }, "image/jpeg")
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setIsCameraActive(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Car Plate Image</CardTitle>
        <CardDescription>Upload or capture a photo of a car plate for detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCameraActive && !preview && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-12 transition-colors hover:border-slate-400 hover:bg-slate-100"
            >
              <Upload className="h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {/* Hidden camera input for mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />

            {/* Camera button - different behavior for mobile vs desktop */}
            {isMobile ? (
              <Button onClick={openMobileCamera} variant="outline" className="w-full gap-2 bg-transparent">
                <Camera className="h-4 w-4" />
                Take Photo with Camera
              </Button>
            ) : (
              <Button onClick={startCamera} variant="outline" className="w-full gap-2 bg-transparent">
                <Camera className="h-4 w-4" />
                Take Photo with Camera
              </Button>
            )}

            {/* Show camera error if any */}
            {cameraError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {cameraError}
              </div>
            )}
          </div>
        )}

        {isCameraActive && !preview && (
          <div className="space-y-3">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
            <div className="flex gap-3">
              <Button onClick={capturePhoto} className="flex-1">
                Capture Photo
              </Button>
              <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview || "/placeholder.svg"} alt="preview" className="w-full rounded-lg" />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            {!isLoading && (
              <Button
                onClick={() => {
                  setPreview(null)
                  fileInputRef.current?.click()
                }}
                variant="outline"
                className="w-full"
              >
                Try Another Image
              </Button>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
