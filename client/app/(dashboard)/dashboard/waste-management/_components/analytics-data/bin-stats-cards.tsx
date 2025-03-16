"use client"

import type { BinFillLevel } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Trash2 } from "lucide-react"

interface BinStatsCardsProps {
  data: BinFillLevel[]
}

export function BinStatsCards({ data }: BinStatsCardsProps) {
  // Define bin types and their display properties
  const binTypes = [
    { id: "paper", name: "Paper", color: "#EAB308", icon: Trash2 },
    { id: "plastic", name: "Plastic", color: "#EF4444", icon: Trash2 },
    { id: "organic", name: "Organic", color: "#22C55E", icon: Trash2 },
    { id: "glass", name: "Glass", color: "#3B82F6", icon: Trash2 },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {binTypes.map((binType) => {
        const binData = data.find((item) => item.binType === binType.id)
        const fillPercent = binData?.fillPercent || 0
        const isAlert = binData?.isAlert || false

        // Determine if the bin is getting full
        const isCritical = fillPercent >= 80
        const isWarning = fillPercent >= 50 && fillPercent < 80

        return (
          <Card key={binType.id} className={`${isAlert ? "border-red-400" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: binType.color }} />
                {binType.name} Bin
                {isAlert && <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />}
              </CardTitle>
              <CardDescription>Current fill level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fillPercent.toFixed(1)}%</div>
              <div className="flex items-center mt-1">
                <div
                  className={`text-xs ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-green-500"}`}
                >
                  {isCritical
                    ? "Critical - Empty Soon"
                    : isWarning
                      ? "Warning - Getting Full"
                      : "Good - Plenty of Space"}
                </div>
              </div>
              <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

