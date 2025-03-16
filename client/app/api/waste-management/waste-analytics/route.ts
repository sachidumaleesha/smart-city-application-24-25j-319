import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "week"

    // Calculate date range
    const endDate = new Date()
    let startDate: Date

    if (timeRange === "week") {
      startDate = new Date()
      startDate.setDate(endDate.getDate() - 7)
    } else {
      startDate = new Date()
      startDate.setMonth(endDate.getMonth() - 1)
    }

    // Fetch data from database
    const binData = await prisma.binFillLevel.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Process data for chart
    const chartData = processDataForChart(binData, timeRange)

    // Calculate trend
    const trend = calculateTrend(binData, timeRange)

    return NextResponse.json({
      success: true,
      chartData,
      trend,
    })
  } catch (error) {
    console.error("Error fetching waste analytics data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch waste analytics data" }, { status: 500 })
  }
}

// Helper function to process data for chart
function processDataForChart(data: any[], timeRange: string) {
  // Group data by date
  const groupedData: Record<string, any> = {}

  data.forEach((record) => {
    // Format date based on time range
    let dateKey: string
    const date = new Date(record.createdAt)

    if (timeRange === "week") {
      // For week view, group by day
      dateKey = date.toLocaleDateString()
    } else {
      // For month view, group by 3-day periods
      const day = Math.floor(date.getDate() / 3) * 3
      const groupDate = new Date(date)
      groupDate.setDate(day || 1) // Ensure we don't set day to 0
      dateKey = groupDate.toLocaleDateString()
    }

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = {
        date: dateKey,
        paper: 0,
        plastic: 0,
        organic: 0,
        glass: 0,
        totalRecords: 0,
      }
    }

    // Add fill percentage to the appropriate bin type
    groupedData[dateKey][record.binType] += record.fillPercent
    groupedData[dateKey].totalRecords += 1
  })

  // Calculate averages
  Object.keys(groupedData).forEach((date) => {
    const group = groupedData[date]
    const binTypes = ["paper", "plastic", "organic", "glass"]

    binTypes.forEach((type) => {
      // Count records for this bin type
      const typeRecords = data.filter(
        (r) => new Date(r.createdAt).toLocaleDateString() === date && r.binType === type,
      ).length

      // If we have records, calculate average
      if (typeRecords > 0) {
        group[type] = Math.round(group[type] / typeRecords)
      }
    })
  })

  // Convert to array and sort by date
  return Object.values(groupedData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Helper function to calculate trend
function calculateTrend(data: any[], timeRange: string) {
  if (data.length < 2) {
    return { value: 0, direction: "up" as const }
  }

  // Group data by day
  const dailyData: Record<string, number[]> = {}

  data.forEach((record) => {
    const date = new Date(record.createdAt).toLocaleDateString()

    if (!dailyData[date]) {
      dailyData[date] = []
    }

    dailyData[date].push(record.fillPercent)
  })

  // Calculate daily averages
  const dailyAverages = Object.entries(dailyData).map(([date, values]) => ({
    date,
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
  }))

  // Sort by date
  dailyAverages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate trend (compare first half to second half)
  const midpoint = Math.floor(dailyAverages.length / 2)
  const firstHalf = dailyAverages.slice(0, midpoint)
  const secondHalf = dailyAverages.slice(midpoint)

  const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.average, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.average, 0) / secondHalf.length

  const trendValue = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
  const trendDirection = secondHalfAvg > firstHalfAvg ? "up" : "down"

  return {
    value: Number.parseFloat(trendValue.toFixed(1)),
    direction: trendDirection as "up" | "down",
  }
}