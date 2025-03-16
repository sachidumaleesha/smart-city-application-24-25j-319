import { NextResponse } from "next/server"
import {prisma} from "@/lib/db"
import { serializeBigInt } from "@/lib/utils"

export async function GET() {
  try {
    // Get alert statistics
    const alertStats = await prisma.$queryRaw`
      SELECT 
        "binType",
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "BinAlertHistory") as percentage
      FROM "BinAlertHistory"
      GROUP BY "binType"
    `

    // If no data is available, return mock data
    if (!alertStats || (Array.isArray(alertStats) && alertStats.length === 0)) {
      const mockData = [
        { binType: "paper", count: 12, percentage: 25 },
        { binType: "plastic", count: 18, percentage: 37.5 },
        { binType: "organic", count: 10, percentage: 20.8 },
        { binType: "glass", count: 8, percentage: 16.7 },
      ]

      return NextResponse.json({ success: true, data: mockData })
    }

    // Serialize BigInt values
    const serializedData = serializeBigInt(alertStats)

    // Process the data to ensure all values are numbers
    const processedData = serializedData.map((alert: any) => ({
      binType: alert.binType,
      count: Number(alert.count),
      percentage: Number(alert.percentage.toFixed(1)),
    }))

    return NextResponse.json({ success: true, data: processedData })
  } catch (error: any) {
    console.error("Error fetching bin alert data:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}