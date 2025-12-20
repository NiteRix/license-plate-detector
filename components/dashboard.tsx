"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Trash2, Cloud, AlertCircle } from "lucide-react"
import PlateUploader from "@/components/plate-uploader"
import PlateResults from "@/components/plate-results"
import { DetectedPlate, hybridStorage } from "@/lib/hybrid-storage"
import { useToast } from "@/lib/toast-context"
import { ConfirmationModal } from "@/components/confirmation-modal"

interface DashboardProps {
  user: { email: string; name: string } | null
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [plates, setPlates] = useState<DetectedPlate[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; plateId: string | null }>({
    isOpen: false,
    plateId: null,
  })
  const [clearAllConfirmation, setClearAllConfirmation] = useState(false)
  const { addToast } = useToast()

  // Load plates from localStorage on component mount and sync from Supabase
  useEffect(() => {
    const loadPlates = async () => {
      try {
        const storedPlates = hybridStorage.getPlates()
        setPlates(storedPlates)

        // Try to sync from Supabase
        try {
          setIsSyncing(true)
          const syncedPlates = await hybridStorage.syncFromSupabase()
          setPlates(syncedPlates)
          setSyncError(null)
        } catch (error) {
          console.error('Sync error:', error)
          setSyncError('Failed to sync with cloud storage')
        } finally {
          setIsSyncing(false)
        }
      } catch (error) {
        console.error('Error loading plates:', error)
        addToast('Failed to load plates', 'error')
      }
    }

    loadPlates()
  }, [addToast])

  const handlePlateDetected = (plate: DetectedPlate) => {
    try {
      const updatedPlates = hybridStorage.addPlate(plate)
      setPlates(updatedPlates)
      addToast('Plate detected successfully', 'success')
    } catch (error: any) {
      addToast(error.message || 'Failed to save plate', 'error')
    }
  }

  const handleUpdatePlate = (plateId: string, updates: Partial<DetectedPlate>) => {
    try {
      const updatedPlates = hybridStorage.updatePlate(plateId, updates)
      setPlates(updatedPlates)
      addToast('Plate updated successfully', 'success')
    } catch (error: any) {
      addToast(error.message || 'Failed to update plate', 'error')
    }
  }

  const handleDeletePlate = (plateId: string) => {
    setDeleteConfirmation({ isOpen: true, plateId })
  }

  const confirmDeletePlate = async () => {
    if (!deleteConfirmation.plateId) return

    try {
      const updatedPlates = hybridStorage.deletePlate(deleteConfirmation.plateId)
      setPlates(updatedPlates)
      addToast('Plate deleted successfully', 'success')

      // Sync deletion to Supabase in background
      try {
        await hybridStorage.deletePlateFromSupabase(deleteConfirmation.plateId)
      } catch (error) {
        console.error('Failed to sync deletion to Supabase:', error)
        addToast('Plate deleted locally but sync failed', 'warning')
      }
    } catch (error: any) {
      console.error('Error deleting plate:', error)
      addToast(error.message || 'Failed to delete plate', 'error')
      throw error
    } finally {
      setDeleteConfirmation({ isOpen: false, plateId: null })
    }
  }

  const handleExportPlates = () => {
    try {
      const jsonData = hybridStorage.exportPlates()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plate-detections-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('Plates exported successfully', 'success')
    } catch (error: any) {
      addToast(error.message || 'Error exporting plates', 'error')
    }
  }

  const handleImportPlates = (jsonData: string) => {
    try {
      const importedPlates = hybridStorage.importPlates(jsonData)
      setPlates(importedPlates)
      addToast(`Successfully imported ${importedPlates.length} plates`, 'success')
    } catch (error: any) {
      addToast(error.message || 'Error importing plates: Invalid file format', 'error')
    }
  }

  const handleClearAllPlates = () => {
    setClearAllConfirmation(true)
  }

  const confirmClearAllPlates = async () => {
    try {
      hybridStorage.clearAllPlates()
      setPlates([])
      addToast('All plates cleared successfully', 'success')

      // Clear from Supabase in background
      try {
        await hybridStorage.clearAllPlatesFromSupabase()
      } catch (error) {
        console.error('Failed to clear plates from Supabase:', error)
        addToast('Plates cleared locally but cloud sync failed', 'warning')
      }
    } catch (error: any) {
      addToast(error.message || 'Failed to clear plates', 'error')
      throw error
    } finally {
      setClearAllConfirmation(false)
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

      {/* Sync Status */}
      {syncError && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span>{syncError}</span>
          </div>
        </div>
      )}

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
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => hybridStorage.syncAllUnsynced()}
                  disabled={isSyncing}
                  className="w-full"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
                </Button>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Plate"
        description="Are you sure you want to delete this plate?"
        message="This action will remove the plate from both local storage and cloud storage. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDeletePlate}
        onCancel={() => setDeleteConfirmation({ isOpen: false, plateId: null })}
      />

      {/* Clear All Confirmation Modal */}
      <ConfirmationModal
        isOpen={clearAllConfirmation}
        title="Clear All Plates"
        description="Are you sure you want to delete all plates?"
        message="This action will permanently delete all plates from both local storage and cloud storage. This cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmClearAllPlates}
        onCancel={() => setClearAllConfirmation(false)}
      />
    </div>
  )
}

