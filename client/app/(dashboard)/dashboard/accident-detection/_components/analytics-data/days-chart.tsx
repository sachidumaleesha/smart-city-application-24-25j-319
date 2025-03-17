"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

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

// ✅ Accident data for each location
const chartData = [
  { location: "Kaduwela", accidents: 12, fill: "var(--color-kaduwela)" },
  { location: "Malabe", accidents: 8, fill: "var(--color-malabe)" },
  { location: "Welivita", accidents: 15, fill: "var(--color-welivita)" },
  { location: "Pittugala", accidents: 5, fill: "var(--color-pittugala)" },
];

const chartConfig = {
  accidents: {
    label: "Accidents",
  },
  kaduwela: {
    label: "Kaduwela",
    color: "hsl(var(--chart-1))",
  },
  malabe: {
    label: "Malabe",
    color: "hsl(var(--chart-2))",
  },
  welivita: {
    label: "Welivita",
    color: "hsl(var(--chart-3))",
  },
  pittugala: {
    label: "Pittugala",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function DaysChart() {
  const totalAccidents = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.accidents, 0);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Accident Detection
      </h2>
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Accident Distribution by Location</CardTitle>
          <CardDescription>For the past 7 days</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="accidents"
                nameKey="location"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalAccidents.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Total Accidents
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>

        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending up by 12% this week <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Accident statistics for Kaduwela, Malabe, Welivita, and Pittugala
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default DaysChart;
