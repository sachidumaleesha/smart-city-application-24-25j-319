"use client"

import React, { useEffect, useState } from "react"
import { BarChart, Bar, CartesianGrid, XAxis, Tooltip as RechartsTooltip } from "recharts"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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

// Sample chart data for the bar chart
const chartData = Array.from({ length: 31 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (30 - i)) // Starts 30 days ago and goes to today
  return {
    date: d.toISOString().replace("T", " ").substring(0, 16), // e.g., "2024-03-08 14:30"
    value: Math.floor(Math.random() * 50) + 1,
  }
})

// Sample chart config
const chartConfig: ChartConfig = {
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
  const [generatedAt, setGeneratedAt] = useState<string>("")

  useEffect(() => {
    // Fetch snapshot reports
    fetch("http://localhost:5000/cctv/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.reports) {
          setReports(data.reports)
          // Set the generated date/time when reports are fetched
          setGeneratedAt(new Date().toLocaleString())
        }
      })
      .catch((err) => console.error("Error fetching reports:", err))
  }, [])

  // Function that generates the PDF report
  async function generateReport() {
    const input = document.getElementById("reportContainer")
    if (input) {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, imageTimeout: 0 })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.text(`Report Generated: ${generatedAt}`, 10, pdfHeight + 10)
      pdf.save("report.pdf")
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Generate Report Button */}
      <div>
        <button
          onClick={generateReport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Generate Report
        </button>
      </div>

      {/* Wrap the entire report in a container for PDF capture */}
      <div id="reportContainer">
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
              <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                {/* Define gradient fill */}
                <defs>
                  <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0000ff" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ff0000" stopOpacity={0.8} />
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
                <Bar dataKey="value" fill="url(#gradientFill)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Snapshots Section */}
        <Card>
          <CardHeader>
            <CardTitle>Suspicious Activity Snapshots</CardTitle>
            <CardDescription>
              A grid of snapshot images captured from the control panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-gray-600">No snapshots available.</p>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {reports.slice(0, 50).map((report, index) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <img
                      src={report.image_url}
                      alt={`Snapshot taken at ${report.timestamp}`}
                      className="w-full object-cover"
                    />
                    <div className="p-2 text-md font-semibold text-gray-600">
                      {report.timestamp
                        ? new Date(report.timestamp).toLocaleString()
                        : "No timestamp available"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Details */}
      <Card>
        <CardHeader>
          <CardTitle>Report Statistics</CardTitle>
          <CardDescription>
            Report generated on: {generatedAt}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Total Snapshots: {reports.length}</p>
          <p>Total Random Daily Count (Chart): {chartData.reduce((acc, cur) => acc + cur.value, 0)}</p>
          {/* Additional stats details can be added here */}
        </CardContent>
      </Card>
    </div>
  )
}