"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Trash2 } from "lucide-react"
import PlateUploader from "@/components/plate-uploader"
import PlateResults from "@/components/plate-results"
import { DetectedPlate, plateStorage } from "@/lib/storage"

interface DashboardProps {
  user: { email: string; name: string } | null
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [plates, setPlates] = useState<DetectedPlate[]>([])

  // Load plates from localStorage on component mount
  useEffect(() => {
    const storedPlates = plateStorage.getPlates()
    setPlates(storedPlates)
  }, [])

  const handlePlateDetected = (plate: DetectedPlate) => {
    const updatedPlates = plateStorage.addPlate(plate)
    setPlates(updatedPlates)
  }

  const handleUpdatePlate = (plateId: string, updates: Partial<DetectedPlate>) => {
    const updatedPlates = plateStorage.updatePlate(plateId, updates)
    setPlates(updatedPlates)
  }

  const handleDeletePlate = (plateId: string) => {
    if (confirm('Are you sure you want to delete this plate?')) {
      const updatedPlates = plateStorage.deletePlate(plateId)
      setPlates(updatedPlates)
    }
  }

  const handleExportPlates = () => {
    try {
      const jsonData = plateStorage.exportPlates()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plate-detections-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Error exporting plates')
    }
  }

  const handleImportPlates = (jsonData: string) => {
    try {
      const importedPlates = plateStorage.importPlates(jsonData)
      setPlates(importedPlates)
      alert(`Successfully imported ${importedPlates.length} plates`)
    } catch (error) {
      alert('Error importing plates: Invalid file format')
    }
  }

  const handleClearAllPlates = () => {
    if (confirm('Are you sure you want to delete all plates? This action cannot be undone.')) {
      plateStorage.clearAllPlates()
      setPlates([])
    }
  }

  // Calculate statistics
  const verifiedPlates = plates.filter(plate => plate.isVerified).length
  const todayPlates = plates.filter(plate => {
    const plateDate = new Date(plate.timestamp).toDateString()
    const today = new Date().toDateString()
    return plateDate === today
  }).length

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
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plates Detected</p>
                  <p className="text-3xl font-bold">{plates.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified Plates</p>
                  <p className="text-2xl font-bold text-green-600">{verifiedPlates}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Detections</p>
                  <p className="text-2xl font-bold text-blue-600">{todayPlates}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllPlates}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        <div className="mt-8">
          <PlateResults
            plates={plates}
            onUpdatePlate={handleUpdatePlate}
            onDeletePlate={handleDeletePlate}
            onExportPlates={handleExportPlates}
            onImportPlates={handleImportPlates}
          />
        </div>
      </main>
    </div>
  )
}
