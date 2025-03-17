"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Updated chart data for seven days with vehicle parking and busy hours.
const chartData = [
  { day: "Mon", parking: 80, busyHours: 3 },
  { day: "Tue", parking: 120, busyHours: 5 },
  { day: "Wed", parking: 90, busyHours: 2 },
  { day: "Thu", parking: 150, busyHours: 6 },
  { day: "Fri", parking: 200, busyHours: 8 },
  { day: "Sat", parking: 250, busyHours: 10 },
  { day: "Sun", parking: 100, busyHours: 4 },
];

const chartConfig = {
  parking: {
    label: "Parking",
    color: "hsl(var(--chart-1))",
  },
  busyHours: {
    label: "Busy Hours",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function Component() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Vehicle Parking & Busy Hours</CardTitle>
        <CardDescription>Last 7 Days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          style={{ height: "300px", width: "750px" }}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ right: 16 }}
            barGap={5}
            barCategoryGap={10}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="day"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <XAxis dataKey="parking" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Legend />
            <Bar
              dataKey="parking"
              layout="vertical"
              fill={chartConfig.parking.color}
              radius={4}
              barSize={30}
              name={chartConfig.parking.label}
            >
              <LabelList
                dataKey="parking"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
            <Bar
              dataKey="busyHours"
              layout="vertical"
              fill={chartConfig.busyHours.color}
              radius={4}
              barSize={30}
              name={chartConfig.busyHours.label}
            >
              <LabelList
                dataKey="busyHours"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-center gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Total vehicle parking and busy hours for the last 7 days
        </div>
      </CardFooter>
    </Card>
  );
}