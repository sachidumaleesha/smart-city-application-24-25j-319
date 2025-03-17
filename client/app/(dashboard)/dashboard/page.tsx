import { prisma } from "@/lib/db";
import { BinStatsCards } from "./waste-management/_components/analytics-data/bin-stats-cards";
import { Component as ReportEngineClient } from "./surveillance-enhancement/reportengine/ReportEngineClient";
import DaysChart from "./accident-detection/_components/analytics-data/days-chart";

async function getBinData() {
  // Get the current fill levels (latest record for each bin type)
  const currentFillLevels = await prisma.binFillLevel.findMany({
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["binType"],
  });

  return {
    currentFillLevels,
  };
}

export default async function Page() {
  const { currentFillLevels } = await getBinData();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
      
      <div>Survilliance Component<ReportEngineClient /></div>

      <BinStatsCards data={currentFillLevels} />
      <DaysChart />
      <div>Parking Management</div>
    </div>
  );
}