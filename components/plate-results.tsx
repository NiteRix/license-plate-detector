"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface DetectedPlate {
  id: string
  plateNumber: string
  timestamp: string
  imageUrl: string
  confidence: number
}

interface PlateResultsProps {
  plates: DetectedPlate[]
}

export default function PlateResults({ plates }: PlateResultsProps) {
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
        <CardTitle>Detection History</CardTitle>
        <CardDescription>Recently detected car plates</CardDescription>
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
                </div>
                <p className="text-sm text-muted-foreground">{format(new Date(plate.timestamp), "PPpp")}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
