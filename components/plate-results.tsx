"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, Download, Upload, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { DetectedPlate } from "@/lib/hybrid-storage"

interface PlateResultsProps {
  plates: DetectedPlate[]
  onUpdatePlate: (plateId: string, updates: Partial<DetectedPlate>) => void
  onDeletePlate: (plateId: string) => void
  onExportPlates: () => void
  onImportPlates: (jsonData: string) => void
}

export default function PlateResults({
  plates,
  onUpdatePlate,
  onDeletePlate,
  onExportPlates,
  onImportPlates
}: PlateResultsProps) {
  const [editingPlate, setEditingPlate] = useState<DetectedPlate | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEditPlate = (plate: DetectedPlate) => {
    setEditingPlate({ ...plate })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingPlate) {
      onUpdatePlate(editingPlate.id, editingPlate)
      setIsEditDialogOpen(false)
      setEditingPlate(null)
    }
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string
          onImportPlates(jsonData)
        } catch (error) {
          alert('Error importing file: Invalid JSON format')
        }
      }
      reader.readAsText(file)
    }
  }

  if (plates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No plates detected yet. Upload an image to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Detection History</CardTitle>
            <CardDescription>Recently detected car plates ({plates.length} total)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportPlates}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </label>
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plates.map((plate) => (
            <div
              key={plate.id}
              className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
            >
              <div className="h-20 w-24 flex-shrink-0 rounded-md bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={plate.imageUrl || "/placeholder.svg"}
                  alt="plate"
                  className="h-full w-full rounded-md object-cover"
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-slate-900">{plate.plateNumber}</span>
                  <Badge variant="secondary">{Math.round(plate.confidence * 100)}% confidence</Badge>
                  {plate.isVerified && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{format(new Date(plate.timestamp), "PPpp")}</p>
                {plate.location && (
                  <p className="text-sm text-slate-600">📍 {plate.location}</p>
                )}
                {plate.vehicleType && (
                  <p className="text-sm text-slate-600">🚗 {plate.vehicleType}</p>
                )}
                {plate.notes && (
                  <p className="text-sm text-slate-600 italic">"{plate.notes}"</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPlate(plate)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeletePlate(plate.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Plate Information</DialogTitle>
            <DialogDescription>
              Update the details for this detected plate.
            </DialogDescription>
          </DialogHeader>
          {editingPlate && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plateNumber" className="text-right">
                  Plate Number
                </Label>
                <Input
                  id="plateNumber"
                  value={editingPlate.plateNumber}
                  onChange={(e) => setEditingPlate({ ...editingPlate, plateNumber: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={editingPlate.location || ''}
                  onChange={(e) => setEditingPlate({ ...editingPlate, location: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Cairo, Egypt"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vehicleType" className="text-right">
                  Vehicle Type
                </Label>
                <Select
                  value={editingPlate.vehicleType || ''}
                  onValueChange={(value) => setEditingPlate({ ...editingPlate, vehicleType: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={editingPlate.notes || ''}
                  onChange={(e) => setEditingPlate({ ...editingPlate, notes: e.target.value })}
                  className="col-span-3"
                  placeholder="Add any additional notes..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="verified" className="text-right">
                  Verified
                </Label>
                <div className="col-span-3">
                  <Button
                    variant={editingPlate.isVerified ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditingPlate({ ...editingPlate, isVerified: !editingPlate.isVerified })}
                  >
                    {editingPlate.isVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      'Mark as Verified'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
