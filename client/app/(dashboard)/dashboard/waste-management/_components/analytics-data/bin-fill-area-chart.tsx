"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

// Define the chart configuration with bin types
const chartConfig = {
  paper: {
    label: "Paper",
    color: "hsl(48 96% 53%)", // Yellow
  },
  plastic: {
    label: "Plastic",
    color: "hsl(0 84% 60%)", // Red
  },
  organic: {
    label: "Organic",
    color: "hsl(142 71% 45%)", // Green
  },
  glass: {
    label: "Glass",
    color: "hsl(217 91% 60%)", // Blue
  },
} satisfies ChartConfig

export function BinFillAreaChart() {
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/waste-management/bin-fill-history?timeRange=${timeRange}`)
        const data = await response.json()

        if (data.success) {
          setChartData(data.chartData)
        }
      } catch (error) {
        console.error("Failed to fetch bin fill history data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  // Get time range description
  const getTimeRangeDescription = () => {
    switch (timeRange) {
      case "7d":
        return "last 7 days"
      case "30d":
        return "last 30 days"
      case "90d":
      default:
        return "last 3 months"
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Bin Fill Levels</CardTitle>
          <CardDescription>Showing fill level trends for the {getTimeRangeDescription()}</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select time range">
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillPaper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-paper)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-paper)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPlastic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-plastic)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-plastic)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillOrganic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-organic)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-organic)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillGlass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-glass)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-glass)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    formatter={(value) => [`${value}%`, "Fill Level"]}
                    indicator="dot"
                  />
                }
              />
              <Area dataKey="paper" type="monotone" fill="url(#fillPaper)" stroke="var(--color-paper)" stackId="a" />
              <Area
                dataKey="plastic"
                type="monotone"
                fill="url(#fillPlastic)"
                stroke="var(--color-plastic)"
                stackId="a"
              />
              <Area
                dataKey="organic"
                type="monotone"
                fill="url(#fillOrganic)"
                stroke="var(--color-organic)"
                stackId="a"
              />
              <Area dataKey="glass" type="monotone" fill="url(#fillGlass)" stroke="var(--color-glass)" stackId="a" />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}