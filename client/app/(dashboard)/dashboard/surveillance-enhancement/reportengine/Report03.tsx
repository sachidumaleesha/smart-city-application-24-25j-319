"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "July", count: 18 },
  { month: "August", count: 18 },
  { month: "September", count: 18 },
  { month: "October", count: 17 },
  { month: "November", count: 15 },
  { month: "December ", count: 13 },
  { month: "January", count: 14 },
  { month: "February", count: 30 },
  { month: "March", count: 23 },
  
]

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function Component() {
  return (
    
    <Card>
      <CardHeader>
        <CardTitle className="items-center mx-auto">Threats Detection Count By Month</CardTitle>
       
        <CardDescription className="items-center mx-auto">Sep - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
      <ChartContainer config={chartConfig} style={{ height: '214px', width: '750px' }}>
          <BarChart
            accessibilityLayer
            data={chartData}
            height={80} // Reduced chart height
            margin={{ top: 10, right: 16, left: 10, bottom: 10 }}
          >
            {/* Define blue gradient */}
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#097BFF" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00BFFF" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="count"
              fill="url(#blueGradient)" // Use blue gradient fill
              radius={8}
              barSize={50} // Reduced bar thickness
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-center gap-2 text-sm mx-auto">
        <div className="flex gap-2 font-medium leading-none ">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing threat detections for the last few months
        </div>
      </CardFooter>
    </Card>
  )
}