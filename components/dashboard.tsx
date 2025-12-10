"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut } from "lucide-react"
import PlateUploader from "@/components/plate-uploader"
import PlateResults from "@/components/plate-results"

interface DashboardProps {
  user: { email: string; name: string } | null
  onLogout: () => void
}

interface DetectedPlate {
  id: string
  plateNumber: string
  timestamp: string
  imageUrl: string
  confidence: number
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [plates, setPlates] = useState<DetectedPlate[]>([])

  const handlePlateDetected = (plate: DetectedPlate) => {
    setPlates([plate, ...plates])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">PlateDetect</h1>
              <p className="text-sm text-slate-600">Welcome, {user?.name}</p>
            </div>
            <Button variant="outline" onClick={onLogout} className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <PlateUploader onPlateDetected={handlePlateDetected} />
          </div>

          {/* Stats Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plates Detected</p>
                  <p className="text-3xl font-bold">{plates.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        <div className="mt-8">
          <PlateResults plates={plates} />
        </div>
      </main>
    </div>
  )
}
