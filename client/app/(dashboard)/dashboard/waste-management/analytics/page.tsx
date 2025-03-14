"use client"

import { useState, useEffect } from "react"
import BinFillLevel from "../_components/bin-fill-level"
import BinLidControl from "../_components/bin-lid-control"
import BinWasteCountGraph from "../_components/bin-waste-count-graph"

export default function AnalyticsPage() {
  // For demo purposes, simulate a bin with changing fill levels
  const [demoDistance, setDemoDistance] = useState<number>(1.2)

  // Simulate data changes for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      // Gradually decrease the distance (bin filling up) with some random fluctuation
      setDemoDistance((prev) => {
        // Random fluctuation between -0.2 and +0.1
        const change = Math.random() * 0.3 - 0.2
        // Ensure distance stays between 0 and 10
        const newValue = Math.max(0, Math.min(10, prev + change))
        return Number(newValue.toFixed(1))
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="container mx-auto">
      {/* <h1 className="text-3xl font-bold mb-8">Waste Management Analytics</h1> */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BinFillLevel distance={demoDistance} />
        <BinLidControl />
        <BinWasteCountGraph/>
      </div>
    </main>
  )
}

