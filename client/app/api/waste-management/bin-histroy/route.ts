import { NextResponse } from "next/server"
import {prisma} from "@/lib/db"
import { serializeBigInt } from "@/lib/utils"

export async function GET() {
  try {
    // Get historical data for the past 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Query to get daily averages for each bin type
    const historicalData = await prisma.$queryRaw`
      WITH daily_averages AS (
        SELECT 
          DATE_TRUNC('day', "createdAt") as day,
          "binType",
          AVG("fillPercent") as avg_fill
        FROM "BinFillLevel"
        WHERE "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt"), "binType"
      )
      SELECT 
        TO_CHAR(day, 'YYYY-MM-DD') as timestamp,
        MAX(CASE WHEN "binType" = 'paper' THEN avg_fill ELSE NULL END) as paper,
        MAX(CASE WHEN "binType" = 'plastic' THEN avg_fill ELSE NULL END) as plastic,
        MAX(CASE WHEN "binType" = 'organic' THEN avg_fill ELSE NULL END) as organic,
        MAX(CASE WHEN "binType" = 'glass' THEN avg_fill ELSE NULL END) as glass
      FROM daily_averages
      GROUP BY day
      ORDER BY day ASC
    `

    // If no data is available, return mock data
    if (!historicalData || (Array.isArray(historicalData) && historicalData.length === 0)) {
      const mockData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))

        return {
          timestamp: date.toISOString().split("T")[0],
          paper: Math.floor(Math.random() * 60) + 20,
          plastic: Math.floor(Math.random() * 60) + 20,
          organic: Math.floor(Math.random() * 60) + 20,
          glass: Math.floor(Math.random() * 60) + 20,
        }
      })

      return NextResponse.json({ success: true, data: mockData })
    }

    // Serialize BigInt values
    const serializedData = serializeBigInt(historicalData)

    // Process the data to ensure all values are numbers
    const processedData = serializedData.map((day: any) => ({
      timestamp: day.timestamp,
      paper: Math.round(day.paper || 0),
      plastic: Math.round(day.plastic || 0),
      organic: Math.round(day.organic || 0),
      glass: Math.round(day.glass || 0),
    }))

    return NextResponse.json({ success: true, data: processedData })
  } catch (error: any) {
    console.error("Error fetching historical bin data:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}