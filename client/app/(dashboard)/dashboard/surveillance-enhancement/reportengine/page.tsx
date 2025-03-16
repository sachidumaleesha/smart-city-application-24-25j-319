"use client"

import React, { useEffect, useState } from "react"
import { BarChart, Bar, CartesianGrid, XAxis, Tooltip as RechartsTooltip } from "recharts"

// Shad UI Card & Chart components – adjust the import paths as needed.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"





// Report interface – each snapshot report has a timestamp and image URL.
interface Report {
  timestamp: string
  image_url: string
}

// Sample chart data for the bar chart (you can adjust this to use your aggregated data)
// Replace your existing chartData declaration with the following:

const chartData = Array.from({ length: 31 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (30 - i)); // Starts 30 days ago and goes to today
  return {
    date: d.toISOString().replace("T", " ").substring(0, 16), // e.g., "2024-03-08 14:30"
    value: Math.floor(Math.random() * 50) + 1, // Random value between 1 and 50
  };
});

// Sample chart config – this object can be extended as needed.
const chartConfig = {
  views: {
    label: "Count",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function ReportEngine() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    // Fetch snapshot reports from your running backend endpoint.
    // Ensure that your backend serves the reports from the snapshots folder.
    fetch("http://localhost:5000/cctv/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.reports) {
          setReports(data.reports)
        }
      })
      .catch((err) => console.error("Error fetching reports:", err))
  }, [])

  return (
    <div className="p-6 space-y-8">
      {/* Card with interactive Bar Chart */}
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>Bar Chart – Interactive</CardTitle>
            <CardDescription>
              Aggregated suspicious activities over dates.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              data={chartData}
              margin={{ left: 12, right: 12 }}
            >
              {/* Define gradient fill */}
              <defs>
                <defs>
                  <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0000ff" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ff0000" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
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
              <RechartsTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              {/* Use the gradient fill via URL */}
              <Bar dataKey="value" fill="url(#gradientFill)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

            // Inside your ReportEngine component's return block:

      {/* Snapshots Section */}
      <Card>
        <CardHeader>
          <CardTitle>Suspicious Activity Snapshots</CardTitle>
          <CardDescription>
            A grid of snapshot images captured from the control panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 && (
            <p className="text-gray-600">No snapshots available.</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {reports.map((report, index) => (
              <div key={index} className="border rounded overflow-hidden">
                <img
                  src={report.image_url} // Ensure this URL is correct (e.g. "/snapshots/snapshot_1742150021.jpg")
                  alt={`Snapshot taken at ${report.timestamp}`}
                  className="w-full object-cover"
                />
                <div className="p-2 text-sm text-gray-600">
                  {report.timestamp
                    ? new Date(report.timestamp).toLocaleString()
                    : "No timestamp available"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}