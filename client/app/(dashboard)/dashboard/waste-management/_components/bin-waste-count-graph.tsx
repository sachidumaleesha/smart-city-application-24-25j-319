"use client"

import * as React from "react"
import { RecycleIcon } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const wasteData = [
  { type: "paper", weight: 275, fill: "var(--color-paper)" },
  { type: "plastic", weight: 200, fill: "var(--color-plastic)" },
  { type: "organic", weight: 287, fill: "var(--color-organic)" },
  { type: "glass", weight: 173, fill: "var(--color-glass)" },
]

const chartConfig = {
  weight: {
    label: "Weight (g)",
  },
  paper: {
    label: "Paper",
    color: "#EAB308", // Yellow
  },
  plastic: {
    label: "Plastic",
    color: "#EF4444", // Red
  },
  organic: {
    label: "Organic",
    color: "#22C55E", // Green
  },
  glass: {
    label: "Glass",
    color: "#3B82F6", // Blue
  },
} satisfies ChartConfig

const BinWasteDistribution = () => {
  const totalWeight = React.useMemo(() => {
    return wasteData.reduce((acc, curr) => acc + curr.weight, 0)
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Waste Distribution</CardTitle>
        <CardDescription>Current Bin Contents</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={wasteData} dataKey="weight" nameKey="type" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }: any) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {totalWeight.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          grams
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Recycling rate: 72% <RecycleIcon className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">Showing waste distribution by weight</div>
      </CardFooter>
    </Card>
  )
}

export default BinWasteDistribution