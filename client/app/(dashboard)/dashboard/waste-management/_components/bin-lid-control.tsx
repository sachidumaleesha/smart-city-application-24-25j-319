"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface BinType {
  id: string
  name: string
  color: string
}

export default function BinLidControl() {
  const bins: BinType[] = [
    { id: "paper", name: "Paper", color: "yellow" },
    { id: "plastic", name: "Plastic", color: "red" },
    { id: "organic", name: "Organic", color: "green" },
    { id: "glass", name: "Glass", color: "purple" },
  ]

  const [openBins, setOpenBins] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const toggleBin = async (binId: string) => {
    const newPosition = openBins[binId] ? "close" : "open"

    // Set loading state
    setLoading((prev) => ({ ...prev, [binId]: true }))

    try {
      const response = await fetch("/api/bin-control/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `bin=${binId}&position=${newPosition}`,
      })

      if (response.ok) {
        // Update state after successful API call
        setOpenBins((prev) => ({ ...prev, [binId]: !prev[binId] }))

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bin Lid Control</CardTitle>
        <CardDescription>Remotely open and close waste bin lids</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bins.map((bin) => (
            <div key={bin.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full bg-${bin.color}-500`} aria-hidden="true"></div>
                <span className="font-medium">{bin.name} Bin</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{openBins[bin.id] ? "Open" : "Closed"}</span>

                {loading[bin.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch
                    checked={openBins[bin.id] || false}
                    onCheckedChange={() => toggleBin(bin.id)}
                    aria-label={`Toggle ${bin.name} bin`}
                  />
                )}

                <Button
                  size="sm"
                  variant={openBins[bin.id] ? "outline" : "default"}
                  onClick={() => toggleBin(bin.id)}
                  disabled={loading[bin.id]}
                >
                  {loading[bin.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {openBins[bin.id] ? "Close" : "Open"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}