"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface BinFillLevelProps {
  binName?: string
  distance?: number
  binHeight?: number
  alertThreshold?: number
}

export default function BinFillLevel({
  binName = "Bin",
  distance = 0,
  binHeight = 10,
  alertThreshold = 4,
}: BinFillLevelProps) {
  const [fillPercentage, setFillPercentage] = useState<number>(0)
  const [isAlert, setIsAlert] = useState<boolean>(false)
  const [alertSent, setAlertSent] = useState<boolean>(false)

  // Get bin type from bin name
  const getBinType = (name: string) => {
    return name.toLowerCase().split(" ")[0]
  }

  // useRefs to hold the latest values for throttled updates
  const latestBinType = useRef(getBinType(binName))
  const latestDistance = useRef(distance || 0)
  const latestFillPercent = useRef(fillPercentage)
  const latestBinHeight = useRef(binHeight)
  const latestIsAlert = useRef(isAlert)
  const prevAlertRef = useRef(isAlert)

  // Update refs whenever the corresponding values change
  useEffect(() => {
    latestBinType.current = getBinType(binName)
  }, [binName])

  useEffect(() => {
    latestDistance.current = distance || 0
  }, [distance])

  useEffect(() => {
    latestFillPercent.current = fillPercentage
  }, [fillPercentage])

  useEffect(() => {
    latestBinHeight.current = binHeight
  }, [binHeight])

  useEffect(() => {
    latestIsAlert.current = isAlert
  }, [isAlert])

  // Calculate fill percentage from distance and set up throttled database updates
  useEffect(() => {
    if (distance !== undefined) {
      const clampedDistance = Math.min(Math.max(distance, 0), binHeight)
      const percentage = Math.round(((binHeight - clampedDistance) / binHeight) * 100)
      setFillPercentage(percentage)

      // Set alert status if distance is less than threshold (bin is getting full)
      const newAlertStatus = clampedDistance < alertThreshold
      setIsAlert(newAlertStatus)

      // Send WhatsApp notification when bin reaches alert threshold
      // but only send it once (until the bin is emptied again)
      if (newAlertStatus && !alertSent) {
        sendWhatsAppAlert(binName, percentage)
        setAlertSent(true)

      }

      // Reset the alert sent flag when bin is no longer in alert state
      if (!newAlertStatus && alertSent) {
        setAlertSent(false)
      }
    }
  }, [distance, binHeight, alertThreshold, binName, alertSent])

  // Add a separate effect for throttled database updates
  useEffect(() => {
    // Set up the interval to save data every 5 seconds
    const intervalId = setInterval(() => {
      const binType = latestBinType.current
      const distance = latestDistance.current
      const fillPercent = latestFillPercent.current
      const binHeight = latestBinHeight.current
      const isAlert = latestIsAlert.current

      console.log(`Saving ${binType} data to database (throttled 5s update)`)
      saveBinData(binType, distance, fillPercent, binHeight, isAlert)
    }, 5000) // 5 seconds

    // Always save immediately when alert status changes
    if (prevAlertRef.current !== isAlert) {
      const binType = latestBinType.current
      const distance = latestDistance.current
      const fillPercentage = latestFillPercent.current
      const binHeight = latestBinHeight.current

      console.log(`Alert status changed for ${binType}, saving immediately`)
      saveBinData(binType, distance, fillPercentage, binHeight, isAlert)
      prevAlertRef.current = isAlert
    }

    return () => {
      clearInterval(intervalId)
    }
  }, [isAlert])

  // Set up real-time subscription to Supabase
  useEffect(() => {
    const binType = getBinType(binName)

    // Subscribe to changes for this specific bin type
    const subscription = supabase
      .channel(`bin-${binType}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "BinFillLevel",
          filter: `binType=eq.${binType}`,
        },
        (payload) => {
          // Only update if the data is newer than what we have
          const newData = payload.new as any
          console.log(`Real-time update for ${binType}:`, newData)

          // We don't update distance here because it would create a loop
          // with our effect above. Instead, we just log the real-time update.
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [binName])

  // Function to save bin data to database
  const saveBinData = async (
    binType: string,
    distance: number,
    fillPercent: number,
    binHeight: number,
    isAlert: boolean,
  ) => {
    try {
      await fetch("/api/waste-management/bin-levels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          binType,
          distance,
          fillPercent,
          binHeight,
          isAlert,
        }),
      })
    } catch (error) {
      console.error("Error saving bin data:", error)
    }
  }

  // Function to send WhatsApp alert
  const sendWhatsAppAlert = async (binName: string, fillPercentage: number) => {
    try {
      const response = await fetch("/api/waste-management/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          binName,
          fillPercentage,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        console.error("Failed to send WhatsApp alert:", data.error)
      }
    } catch (error) {
      console.error("Error sending WhatsApp alert:", error)
    }
  }

  return (
    <Card className={`w-full ${isAlert ? "border-red-400" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{binName} Filling Level</CardTitle>
        {isAlert && <AlertCircle className="h-5 w-5 text-red-500" />}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bin visualization */}
        <div className="relative h-48 w-32 mx-auto border-2 border-gray-300 rounded-md overflow-hidden">
          {/* Fill level */}
          <div
            className={`absolute bottom-0 w-full transition-all duration-500 ${
              fillPercentage > 80 ? "bg-red-500" : fillPercentage > 50 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ height: `${fillPercentage}%` }}
          />
          {/* Level indicator arrow */}
          <div className="absolute left-0 w-full border-t-2 border-black" style={{ top: `${100 - fillPercentage}%` }}>
            <div className="absolute right-0 w-4 h-4 -mt-2 mr-1 text-black">↑</div>
          </div>
        </div>

        {/* Current fill level progress */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Current Fill Level</div>
          <Progress value={fillPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Empty</span>
            <span>Full</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{isAlert ? "Yes" : "No"}</div>
            <div className="text-xs text-muted-foreground">Alert Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{fillPercentage}%</div>
            <div className="text-xs text-muted-foreground">Fill Level</div>
          </div>
        </div>

        {/* Technical details section */}
        <div className="mt-6 space-y-2 pt-4 border-t">
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
      </CardContent>
    </Card>
  )
}