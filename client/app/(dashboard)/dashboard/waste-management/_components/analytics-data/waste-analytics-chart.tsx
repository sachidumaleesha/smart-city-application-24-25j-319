"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useState, useEffect } from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
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

export function WasteAnalyticsChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<{ value: number; direction: "up" | "down" }>({ value: 0, direction: "up" })
  const [timeRange, setTimeRange] = useState<"week" | "month">("week")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/waste-analytics?timeRange=${timeRange}`)
        const data = await response.json()

        if (data.success) {
          setChartData(data.chartData)
          setTrend({
            value: data.trend.value,
            direction: data.trend.direction,
          })
        }
      } catch (error) {
        console.error("Failed to fetch waste analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  // Format date for display
  const formatDateRange = () => {
    const today = new Date()
    const endDate = new Date(today)
    let startDate: Date

    if (timeRange === "week") {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    } else {
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 1)
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Waste Fill Levels</CardTitle>
            <CardDescription>{formatDateRange()}</CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "week" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "month" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData} height={300}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 5)} // Show just MM/DD
              />
              <YAxis tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => `${value}%`} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="paper" stackId="a" fill="var(--color-paper)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="plastic" stackId="a" fill="var(--color-plastic)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="organic" stackId="a" fill="var(--color-organic)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="glass" stackId="a" fill="var(--color-glass)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {trend.direction === "up" ? (
            <>
              Trending up by {trend.value.toFixed(1)}% this {timeRange} <TrendingUp className="h-4 w-4 text-red-500" />
            </>
          ) : (
            <>
              Trending down by {trend.value.toFixed(1)}% this {timeRange}{" "}
              <TrendingDown className="h-4 w-4 text-green-500" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground">Showing stacked fill levels for all bins over time</div>
      </CardFooter>
    </Card>
  )
}