"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BinType {
  id: string
  name: string
  color: string
}

interface BinFillData {
  binType: string
  fillPercent: number
  isAlert: boolean
}

export default function BinLidControl() {
  const bins: BinType[] = [
    { id: "paper", name: "Paper", color: "yellow" },
    { id: "plastic", name: "Plastic", color: "red" },
    { id: "organic", name: "Organic", color: "green" },
    { id: "glass", name: "Glass", color: "blue" },
  ]

  const [openBins, setOpenBins] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [fillLevels, setFillLevels] = useState<Record<string, number>>({})
  const [fetchingLevels, setFetchingLevels] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [openTimestamps, setOpenTimestamps] = useState<Record<string, number>>({})

  // Fetch bin fill levels with automatic 5-second refresh
  useEffect(() => {
    const fetchFillLevels = async () => {
      try {
        setFetchingLevels(true)
        const response = await fetch("/api/waste-management/bin-levels")
        const { success, data } = await response.json()

        if (success && data) {
          const levels: Record<string, number> = {}

          // Convert data to a simple map of binType -> fillPercent
          data.forEach((bin: BinFillData) => {
            levels[bin.binType] = bin.fillPercent
          })

          setFillLevels(levels)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (error) {
        console.error("Error fetching bin fill levels:", error)
        // Don't show toast on every fetch error to avoid spamming the user
      } finally {
        setFetchingLevels(false)
      }
    }

    // Initial fetch
    fetchFillLevels()

    // Set up an interval to automatically refresh fill levels every 5 seconds
    console.log("Setting up automatic 5-second refresh interval")
    const intervalId = setInterval(fetchFillLevels, 5000)

    return () => clearInterval(intervalId)
  }, [])

  // Check for bins that have been open too long
  useEffect(() => {
    const intervalId = setInterval(() => {
      bins.forEach((bin) => {
        if (isOpenTooLong(bin.id)) {
          // Only show the toast if we haven't shown it recently for this bin
          // We could add another state to track this, but for simplicity we'll just check
          const openDuration = Math.floor((Date.now() - openTimestamps[bin.id]) / 60000)
          toast.error(`${bin.name} bin open for ${openDuration} minute${openDuration > 1 ? "s" : ""}`, {
            description: "Please close the bin lid to prevent odors and pests.",
            id: `bin-open-too-long-${bin.id}`, // Use an ID to prevent duplicate toasts
            duration: 10000, // Show for 10 seconds
          })
        }
      })
    }, 10000) // Check every 10 seconds

    return () => clearInterval(intervalId)
  }, [openBins, openTimestamps, bins])

  // Check if a bin is too full to open (80% or more)
  const isBinTooFull = (binId: string) => {
    return (fillLevels[binId] || 0) >= 80
  }

  const toggleBin = async (binId: string) => {
    // If trying to open a bin that's too full, show warning and don't proceed
    if (!openBins[binId] && isBinTooFull(binId)) {
      toast.error(`Cannot open ${bins.find((bin) => bin.id === binId)?.name} bin`, {
        description: "This bin is 80% or more full and cannot be opened. Please empty the bin first.",
      })
      return
    }

    const newPosition = openBins[binId] ? "close" : "open"

    // Set loading state
    setLoading((prev) => ({ ...prev, [binId]: true }))

    try {
      const response = await fetch("/api/waste-management/bin-control", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `bin=${binId}&position=${newPosition}`,
      })

      if (response.ok) {
        // Update state after successful API call
        setOpenBins((prev) => ({ ...prev, [binId]: !prev[binId] }))

        // Track timestamp when bin is opened or clear it when closed
        setOpenTimestamps((prev) => ({
          ...prev,
          [binId]: newPosition === "open" ? Date.now() : 0,
        }))

        // Use sonner toast
        toast.success(`${bins.find((bin) => bin.id === binId)?.name} bin ${newPosition}ed`, {
          description: `The ${bins.find((bin) => bin.id === binId)?.name.toLowerCase()} bin lid has been ${newPosition}ed successfully.`,
        })
      } else {
        throw new Error(`Failed to ${newPosition} bin`)
      }
    } catch (error) {
      console.error("Error controlling bin:", error)

      // Use sonner toast for error
      toast.error("Operation failed", {
        description: `Could not ${newPosition} the bin. Please try again.`,
      })
    } finally {
      // Clear loading state
      setLoading((prev) => ({ ...prev, [binId]: false }))
    }
  }

  // Manual refresh function
  const handleManualRefresh = async () => {
    try {
      setFetchingLevels(true)
      const response = await fetch("/api/waste-management/bin-levels")
      const { success, data } = await response.json()

      if (success && data) {
        const levels: Record<string, number> = {}

        data.forEach((bin: BinFillData) => {
          levels[bin.binType] = bin.fillPercent
        })

        setFillLevels(levels)
        setLastUpdated(new Date().toLocaleTimeString())
        toast.success("Data refreshed successfully")
      }
    } catch (error) {
      console.error("Error refreshing bin data:", error)
      toast.error("Failed to refresh bin data")
    } finally {
      setFetchingLevels(false)
    }
  }

  // Function to check if a bin has been open for more than 1 minute
  const isOpenTooLong = (binId: string) => {
    if (!openBins[binId] || !openTimestamps[binId]) return false
    const openDuration = Date.now() - openTimestamps[binId]
    return openDuration > 60000 // 60000ms = 1 minute
  }

  return (
    <div className="container mx-auto">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              Bin Lid Control
              {fetchingLevels && <Loader2 className="h-4 w-4 ml-2 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>Remotely open and close waste bin lids</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Last updated: {lastUpdated}</span>
            <span className="flex items-center">
              <span className="text-xs mr-1">Auto-refresh:</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleManualRefresh} disabled={fetchingLevels}>
                    <RefreshCw className={`h-4 w-4 ${fetchingLevels ? "animate-spin" : ""}`} />
                    <span className="sr-only">Refresh data</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manually refresh bin data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bins.map((bin) => {
              const fillLevel = fillLevels[bin.id] || 0
              const tooFull = isBinTooFull(bin.id)
              const openTooLong = isOpenTooLong(bin.id)

              return (
                <div
                  key={bin.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border ${
                    tooFull ? "border-red-300 bg-red-50" : openTooLong ? "border-red-300 bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3 md:mb-0">
                    <div
                      className={`w-4 h-4 rounded-full`}
                      style={{
                        backgroundColor:
                          bin.color === "yellow"
                            ? "#EAB308"
                            : bin.color === "red"
                              ? "#EF4444"
                              : bin.color === "green"
                                ? "#22C55E"
                                : "#3B82F6",
                      }}
                      aria-hidden="true"
                    ></div>
                    <span className="font-medium">{bin.name} Bin</span>

                    {tooFull && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>Too full to open</span>
                      </div>
                    )}

                    {openTooLong && (
                      <div className="flex items-center text-red-600 text-sm ml-2">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>Open too long!</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-4">
                    {/* Fill level indicator */}
                    <div className="w-full md:w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Fill Level</span>
                        <span className={fillLevel >= 80 ? "text-red-600 font-bold" : ""}>{fillLevel.toFixed(2)}%</span>
                      </div>
                      <Progress
                        value={fillLevel}
                        className="h-2"
                        indicatorClassName={
                          fillLevel > 80 ? "bg-red-500" : fillLevel > 50 ? "bg-yellow-500" : "bg-green-500"
                        }
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      {openTooLong && (
                        <span className="text-red-600 text-xs font-medium">
                          Open for {Math.floor((Date.now() - openTimestamps[bin.id]) / 60000)} min
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant={openBins[bin.id] ? "outline" : "default"}
                        onClick={() => toggleBin(bin.id)}
                        disabled={loading[bin.id] || (!openBins[bin.id] && tooFull)}
                      >
                        {loading[bin.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {openBins[bin.id] ? "Close" : "Open"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}