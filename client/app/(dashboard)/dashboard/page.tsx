import { prisma } from "@/lib/db";
import { BinStatsCards } from "./waste-management/_components/analytics-data/bin-stats-cards";

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
    <div>
      <BinStatsCards data={currentFillLevels} />
    </div>
  );
}
