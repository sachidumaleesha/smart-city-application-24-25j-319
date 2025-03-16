"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Report {
  timestamp: string;
  image_url: string;
}

// Dummy history data for the line chart (only date/time and activity count)
const dummyHistoryData = [
  { timestamp: "2025-03-10T08:00:00", activityCount: 5 },
  { timestamp: "2025-03-10T10:00:00", activityCount: 7 },
  { timestamp: "2025-03-10T12:00:00", activityCount: 3 },
  { timestamp: "2025-03-10T14:00:00", activityCount: 10 },
  { timestamp: "2025-03-10T16:00:00", activityCount: 4 },
  { timestamp: "2025-03-11T08:00:00", activityCount: 8 },
  { timestamp: "2025-03-11T10:00:00", activityCount: 6 },
  { timestamp: "2025-03-11T12:00:00", activityCount: 9 },
  { timestamp: "2025-03-11T14:00:00", activityCount: 12 },
  { timestamp: "2025-03-11T16:00:00", activityCount: 7 },
];

export default function ReportEngine() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // Fetch snapshot reports from your backend
    fetch("http://localhost:5000/cctv/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.reports) {
          setReports(data.reports);
        }
      })
      .catch((err) => console.error("Error fetching reports:", err));
  }, []);

  // Prepare data for the bar chart using fetched reports
  const dates = Array.from(
    new Set(reports.map((report) => report.timestamp.split("T")[0]))
  ).sort();
  const counts = dates.map((date) =>
    reports.filter((report) => report.timestamp.startsWith(date)).length
  );

  const barChartData = {
    labels: dates,
    datasets: [
      {
        label: "Suspicious Activities",
        data: counts,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Bar Chart: Suspicious Activities by Date",
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Date" },
      },
      y: {
        title: { display: true, text: "Activity Count" },
        beginAtZero: true,
      },
    },
  };

  // Prepare data for the line chart using dummy history data
  const lineChartData = {
    labels: dummyHistoryData.map((item) =>
      new Date(item.timestamp).toLocaleString()
    ),
    datasets: [
      {
        // No label is shown as per your request
        data: dummyHistoryData.map((item) => item.activityCount),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Line Chart: Suspicious Activity History",
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `Activity Count: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Date & Time" },
        ticks: { autoSkip: true, maxRotation: 45, minRotation: 45 },
      },
      y: {
        title: { display: true, text: "Activity Count" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Report Engine</h1>

      {/* Bar Chart Section */}
      <div
        className="bg-white rounded shadow p-4"
        style={{ height: "400px" }}
      >
        <Bar data={barChartData} options={barOptions} />
      </div>

      {/* Line Chart Section */}
      <div
        className="bg-white rounded shadow p-4"
        style={{ height: "400px" }}
      >
        <Line data={lineChartData} options={lineOptions} />
      </div>

      {/* Snapshots Section */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Suspicious Activity Snapshots
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {reports.map((report, index) => (
            <div key={index} className="border rounded overflow-hidden">
              <img
                src={report.image_url}
                alt={`Snapshot at ${report.timestamp}`}
                className="w-full object-cover"
              />
              <div className="p-2 text-sm text-gray-600">
                {new Date(report.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
