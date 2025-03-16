import { prisma } from "@/lib/db"
import { BinFillChart } from "./bin-fill-chart"
import { BinFillHistoryChart } from "./bin-fill-history-chart"
import { BinAlertHistory } from "./bin-alert-history"
import { BinComparisonChart } from "./bin-comparison-chart"
import { BinStatsCards } from "./bin-stats-cards"
import { DateRangePickerWithPresets } from "./date-range-picker"

async function getBinData() {
  // Get the current fill levels (latest record for each bin type)
  const currentFillLevels = await prisma.binFillLevel.findMany({
    orderBy: {
      createdAt: "desc",
    },
    distinct: ["binType"],
  })

  // Get historical data for the past 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const historicalData = await prisma.binFillLevel.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  // Get alert history
  const alertHistory = await prisma.binFillLevel.findMany({
    where: {
      isAlert: true,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return {
    currentFillLevels,
    historicalData,
    alertHistory,
  }
}

export async function BinAnalyticsDashboard() {
  const { currentFillLevels, historicalData, alertHistory } = await getBinData()

  return (
    <div className="space-y-6">
      {/* <BinStatsCards data={currentFillLevels} /> */}

      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-semibold mb-2 md:mb-0">Fill Level History</h2>
          <DateRangePickerWithPresets />
        </div>
        <BinFillHistoryChart data={historicalData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Current Fill Levels</h2>
          <BinFillChart data={currentFillLevels} />
        </div> */}

        {/* <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Bin Comparison</h2>
          <BinComparisonChart data={currentFillLevels} />
        </div> */}
      </div>

      {/* <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Alert History</h2>
        <BinAlertHistory data={alertHistory} />
      </div> */}
    </div>
  )
}