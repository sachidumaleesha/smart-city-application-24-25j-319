"use client"

import type { BinFillLevel } from "@prisma/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"

interface BinComparisonChartProps {
  data: BinFillLevel[]
}

export function BinComparisonChart({ data }: BinComparisonChartProps) {
  // Transform data for the bar chart
  const chartData = data.map((bin) => ({
    name: bin.binType.charAt(0).toUpperCase() + bin.binType.slice(1),
    fillPercent: bin.fillPercent,
    emptySpace: 100 - bin.fillPercent,
    color: getBinColor(bin.binType),
  }))

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Percentage"]} />
          <Legend />
          <Bar dataKey="fillPercent" name="Fill Level" stackId="a" fill="#8884d8" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
          <Bar dataKey="emptySpace" name="Empty Space" stackId="a" fill="#82ca9d" opacity={0.3} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Helper function to get color based on bin type
function getBinColor(binType: string): string {
  switch (binType.toLowerCase()) {
    case "paper":
      return "#EAB308" // yellow
    case "plastic":
      return "#EF4444" // red
    case "organic":
      return "#22C55E" // green
    case "glass":
      return "#3B82F6" // blue
    default:
      return "#6B7280" // gray
  }
}

