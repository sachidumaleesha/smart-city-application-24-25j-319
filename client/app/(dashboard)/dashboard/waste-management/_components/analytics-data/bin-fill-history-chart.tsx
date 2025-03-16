"use client"

import { useState } from "react"
import type { BinFillLevel } from "@prisma/client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface BinFillHistoryChartProps {
  data: BinFillLevel[]
}

export function BinFillHistoryChart({ data }: BinFillHistoryChartProps) {
  const [selectedBins, setSelectedBins] = useState({
    paper: true,
    plastic: true,
    organic: true,
    glass: true,
  })

  // Process data for the chart
  const processedData = processHistoricalData(data)

  // Toggle bin visibility
  const toggleBin = (binType: string) => {
    setSelectedBins((prev) => ({
      ...prev,
      [binType]: !prev[binType as keyof typeof prev],
    }))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="paper" checked={selectedBins.paper} onCheckedChange={() => toggleBin("paper")} />
          <Label htmlFor="paper" className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
            Paper
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="plastic" checked={selectedBins.plastic} onCheckedChange={() => toggleBin("plastic")} />
          <Label htmlFor="plastic" className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
            Plastic
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="organic" checked={selectedBins.organic} onCheckedChange={() => toggleBin("organic")} />
          <Label htmlFor="organic" className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
            Organic
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="glass" checked={selectedBins.glass} onCheckedChange={() => toggleBin("glass")} />
          <Label htmlFor="glass" className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
            Glass
          </Label>
        </div>
      </div>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "MMM dd")} />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), "MMM dd, yyyy HH:mm")}
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Fill Level"]}
            />
            <Legend />
            {selectedBins.paper && (
              <Line type="monotone" dataKey="paper" stroke="#EAB308" activeDot={{ r: 8 }} name="Paper" />
            )}
            {selectedBins.plastic && (
              <Line type="monotone" dataKey="plastic" stroke="#EF4444" activeDot={{ r: 8 }} name="Plastic" />
            )}
            {selectedBins.organic && (
              <Line type="monotone" dataKey="organic" stroke="#22C55E" activeDot={{ r: 8 }} name="Organic" />
            )}
            {selectedBins.glass && (
              <Line type="monotone" dataKey="glass" stroke="#3B82F6" activeDot={{ r: 8 }} name="Glass" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Helper function to process historical data
function processHistoricalData(data: BinFillLevel[]) {
  // Group data by date (day)
  const groupedByDate = data.reduce(
    (acc, item) => {
      const date = new Date(item.createdAt)
      const dateKey = date.toISOString()

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          paper: null,
          plastic: null,
          organic: null,
          glass: null,
        }
      }

      acc[dateKey][item.binType] = item.fillPercent

      return acc
    },
    {} as Record<string, any>,
  )

  // Convert to array and sort by date
  return Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

