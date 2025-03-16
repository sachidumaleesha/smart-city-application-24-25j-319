// "use client";

// import React from "react";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Report } from "./page";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// interface ReportEngineClientProps {
//   reports: Report[];
// }

// export default function ReportEngineClient({ reports }: ReportEngineClientProps) {
//   // Group reports by date for the chart
//   const dates = Array.from(
//     new Set(reports.map((report) => report.timestamp.split("T")[0]))
//   );
//   const counts = dates.map((date) =>
//     reports.filter((report) => report.timestamp.startsWith(date)).length
//   );

//   const chartData = {
//     labels: dates,
//     datasets: [
//       {
//         label: "Suspicious Activities",
//         data: counts,
//         backgroundColor: "rgba(255, 99, 132, 0.5)",
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" as const },
//       title: { display: true, text: "Suspicious Activities by Date" },
//     },
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-4">Report Engine</h1>
//       <div className="mb-8">
//         <Bar data={chartData} options={options} />
//       </div>
//       <div>
//         <h2 className="text-2xl font-semibold mb-4">Suspicious Activity Snapshots</h2>
//         <div className="grid grid-cols-2 gap-4">
//           {reports.map((report, index) => (
//             <div key={index} className="border rounded overflow-hidden">
//               <img
//                 src={report.image_url}
//                 alt={`Snapshot at ${report.timestamp}`}
//                 className="w-full object-cover"
//               />
//               <div className="p-2 text-sm text-gray-600">
//                 {report.timestamp
//                   ? new Date(report.timestamp).toLocaleString()
//                   : "No timestamp"}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }