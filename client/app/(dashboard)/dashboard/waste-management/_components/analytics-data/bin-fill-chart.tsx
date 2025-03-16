"use client"

import type { BinFillLevel } from "@prisma/client"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface BinFillChartProps {
  data: BinFillLevel[]
}

export function BinFillChart({ data }: BinFillChartProps) {
  // Transform data for the pie chart
  const chartData = data.map((bin) => ({
    name: bin.binType.charAt(0).toUpperCase() + bin.binType.slice(1),
    value: bin.fillPercent,
    color: getBinColor(bin.binType),
  }))

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Fill Level"]} />
          <Legend />
        </PieChart>
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

