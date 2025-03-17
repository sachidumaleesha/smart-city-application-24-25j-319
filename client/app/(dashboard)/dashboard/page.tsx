import { prisma } from "@/lib/db";
import { BinStatsCards } from "./waste-management/_components/analytics-data/bin-stats-cards";
import { Component as ReportEngineClient } from "./surveillance-enhancement/reportengine/Report03";
import { Component as VehiclePark } from "./surveillance-enhancement/reportengine/Report02";
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
      
      <div><h1 className="text-xl font-semibold mb-4">Survilliance Component </h1><ReportEngineClient /></div>

      <BinStatsCards data={currentFillLevels} />
      <DaysChart />
      <div><h1 className="text-xl font-semibold mb-4">Parking Management</h1><VehiclePark /></div>
    </div>
  );
}