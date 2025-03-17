"use client"

import React, { useEffect, useState } from "react"
import { BarChart, Bar, CartesianGrid, XAxis, Tooltip as RechartsTooltip } from "recharts"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { Component as ReportEngineClient } from "./ReportEngineClient";
import { Component as Report02 } from "./Report02";

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
  // Generate chartData only on client
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([])

  useEffect(() => {
    // Generate chart data on mount to avoid hydration issues (random values change)
    const data = Array.from({ length: 31 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (30 - i)) // Starts 30 days ago and goes to today
      return {
        date: d.toISOString().replace("T", " ").substring(0, 16),
        value: Math.floor(Math.random() * 50) + 1,
      }
    })
    setChartData(data)
  }, [])

  useEffect(() => {
    // Fetch snapshot reports
    fetch("http://localhost:5000/cctv/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.reports) {
          setReports(data.reports)
          setGeneratedAt(new Date().toLocaleString())
        }
      })
      .catch((err) => console.error("Error fetching reports:", err))
  }, [])

  // Compute incident details from reports
  const incidentTimes = reports
    .map((r) => new Date(r.timestamp))
    .sort((a, b) => a.getTime() - b.getTime())
  const firstIncident = incidentTimes.length > 0 ? incidentTimes[0].toLocaleString() : "N/A"
  const latestIncident =
    incidentTimes.length > 0 ? incidentTimes[incidentTimes.length - 1].toLocaleString() : "N/A"

  // Function that generates the PDF report
  async function generateReport() {
    const input = document.getElementById("reportContainer");
    if (input) {
      // Capture the container as canvas
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, imageTimeout: 0 });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 250; // A4 width in mm
  
      // Calculate dimensions
      const canvasAspect = canvas.height / canvas.width;
      const contentHeight = pdfWidth * canvasAspect;
      const headerHeight = 20;  // Height for the header
      const footerHeight = 40;  // Height for the footer
      const pdfHeight = headerHeight + contentHeight + footerHeight;
  
      // Create a jsPDF instance with custom page size
      const pdf = new jsPDF("p", "mm", [pdfHeight, pdfWidth]);
  
      // --- Header ---
      // Set a colored header background (e.g., cornflower blue)
      pdf.setFillColor(100, 149, 237);
      pdf.rect(0, 0, pdfWidth, headerHeight, 'F');
      // Add header title with white, centered text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Detection Report Summary", pdfWidth / 2, headerHeight / 2 + 5, { align: 'center' });
  
      // --- Main Content ---
      // Insert the captured image just below the header
      pdf.addImage(imgData, "PNG", 0, headerHeight, pdfWidth, contentHeight);
  
      // --- Footer ---
      const footerY = headerHeight + contentHeight;
      // Draw a separating line
      pdf.setDrawColor(150);
      pdf.setLineWidth(0.5);
      pdf.line(10, footerY, pdfWidth - 10, footerY);
      // Footer text details
      pdf.setFontSize(12);
      pdf.setTextColor(50);
      pdf.text(`Report Generated: ${generatedAt}`, 10, footerY + 10);
      pdf.text(`Total Snapshots: ${reports.length}`, 10, footerY + 17);
      pdf.text(`Incident Time Range: ${firstIncident} - ${latestIncident}`, 10, footerY + 24);
      pdf.text(
        `Total Random Daily Count (Chart): ${chartData.reduce((acc, cur) => acc + cur.value, 0)}`,
        10,
        footerY + 31
      );
  
      // --- Optional Watermark ---
      // Add a diagonal watermark to the PDF (e.g., "DRAFT")
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(50);
      pdf.text("", pdfWidth / 2, pdfHeight / 2, { align: 'center', angle: 45 });
  
      pdf.save("report.pdf");
    }
  }
  

  if (chartData.length === 0) return null

  return (
    <div className="p-6 space-y-8">
      {/* Wrap the entire report in a container for PDF capture */}
      <div id="reportContainer">
        {/* Card with interactive Bar Chart */}
        <Card>
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>Surveillance Component – Interactive</CardTitle>
              <CardDescription>
                Aggregated suspicious activities over dates.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
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
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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

        <div>
          <h2 className="text-lg font-bold mb-2"></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportEngineClient />
            <Report02 />
          </div>
        </div>

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
          <CardDescription>Report generated on: {generatedAt}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Total Snapshots: {reports.length}</p>
          <p>
            Total Random Daily Count (Chart):{" "}
            {chartData.reduce((acc, cur) => acc + cur.value, 0)}
          </p>
          <p>First Incident: {firstIncident}</p>
          <p>Latest Incident: {latestIncident}</p>
        </CardContent>

              {/* Generate Report Button */}
      <div className="my-10 mx-5">
        <button
          onClick={generateReport}
          className="bg-slate-700 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded"
        >
          Generate Report
        </button>
      </div>
      </Card>
    </div>
  )
}