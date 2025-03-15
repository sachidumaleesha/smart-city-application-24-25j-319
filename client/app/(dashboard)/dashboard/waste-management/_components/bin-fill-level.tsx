"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BinFillLevelProps {
  distance?: number
  binHeight?: number
  alertThreshold?: number
}

export default function BinFillLevel({ distance = 0.1, binHeight = 10, alertThreshold = 4 }: BinFillLevelProps) {
  const [fillPercentage, setFillPercentage] = useState<number>(99)
  const [alertCount, setAlertCount] = useState<number>(1)

  // Calculate fill percentage from distance
  useEffect(() => {
    if (distance !== undefined) {
      const clampedDistance = Math.min(Math.max(distance, 0), binHeight)
      const percentage = Math.round(((binHeight - clampedDistance) / binHeight) * 100)
      setFillPercentage(percentage)
    }
  }, [distance, binHeight])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bin Filling Level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {/* Left side: Bin visualization */}
          <div className="flex flex-col items-center justify-center">
            {/* Bin visualization */}
            <div className="relative h-48 w-32 border-2 border-gray-300 rounded-md overflow-hidden">
              {/* Fill level */}
              <div
                className={`absolute bottom-0 w-full transition-all duration-500 ${
                  fillPercentage > 80 ? "bg-red-500" : fillPercentage > 50 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ height: `${fillPercentage}%` }}
              />
              {/* Level indicator arrow */}
              <div
                className="absolute left-0 w-full border-t-2 border-black"
                style={{ top: `${100 - fillPercentage}%` }}
              >
                <div className="absolute right-0 w-4 h-4 -mt-2 mr-1 text-black">↑</div>
              </div>
            </div>
          </div>

          {/* Right side: Stats and details */}
          <div className="flex flex-col space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md p-3 text-center">
                <div className="text-2xl font-bold">{alertCount}</div>
                <div className="text-xs text-muted-foreground">Alert total</div>
              </div>
              <div className="border rounded-md p-3 text-center">
                <div className="text-2xl font-bold">{fillPercentage}%</div>
                <div className="text-xs text-muted-foreground">Avg Fill Level</div>
              </div>
            </div>

            {/* Technical details section */}
            <div className="space-y-2 border rounded-md p-3">
              <div className="flex justify-between">
                <span className="text-sm">Distance to Waste:</span>
                <span className="text-sm font-medium">{distance?.toFixed(1) || "-"} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Bin Height:</span>
                <span className="text-sm font-medium">{binHeight} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Alert Threshold:</span>
                <span className="text-sm font-medium">{alertThreshold} cm</span>
              </div>
            </div>
          </div>
        </div>
        {/* Current fill level progress - spans full width */}
        <div className="w-full space-y-2 mt-6 pt-6 border-t">
          <div className="text-sm font-medium">Current Fill Level</div>
          <Progress value={fillPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Empty</span>
            <span>Full</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}