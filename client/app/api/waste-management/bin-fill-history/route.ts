import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "90d"

    // Calculate date range
    const endDate = new Date()
    let startDate: Date

    if (timeRange === "7d") {
      startDate = new Date()
      startDate.setDate(endDate.getDate() - 7)
    } else if (timeRange === "30d") {
      startDate = new Date()
      startDate.setDate(endDate.getDate() - 30)
    } else {
      // Default to 90 days
      startDate = new Date()
      startDate.setDate(endDate.getDate() - 90)
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

    return NextResponse.json({
      success: true,
      chartData,
    })
  } catch (error) {
    console.error("Error fetching bin fill history data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bin fill history data" }, { status: 500 })
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

    // Use ISO string format for the date key
    dateKey = date.toISOString().split("T")[0]

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

  // Calculate averages and ensure all bin types have values
  Object.keys(groupedData).forEach((date) => {
    const group = groupedData[date]
    const binTypes = ["paper", "plastic", "organic", "glass"]

    binTypes.forEach((type) => {
      // Count records for this bin type
      const typeRecords = data.filter(
        (r) => new Date(r.createdAt).toISOString().split("T")[0] === date && r.binType === type,
      ).length

      // If we have records, calculate average, otherwise set to 0
      if (typeRecords > 0) {
        group[type] = Math.round(group[type] / typeRecords)
      } else {
        group[type] = 0
      }
    })
  })

  // Convert to array and sort by date
  const result = Object.values(groupedData).sort(
    (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // For sparse data, we might need to fill in missing dates
  return fillMissingDates(result, timeRange)
}

// Helper function to fill in missing dates in the data
function fillMissingDates(data: any[], timeRange: string) {
  if (data.length === 0) return []

  const result = [...data]
  const startDate = new Date(data[0].date)
  const endDate = new Date(data[data.length - 1].date)

  // Create a map of existing dates
  const dateMap = new Map()
  data.forEach((item) => {
    dateMap.set(item.date, true)
  })

  // Fill in missing dates
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0]

    if (!dateMap.has(dateStr)) {
      // Find the closest previous and next data points
      const prevData = findClosestPreviousData(data, currentDate)
      const nextData = findClosestNextData(data, currentDate)

      // Interpolate values
      const newEntry = {
        date: dateStr,
        paper: interpolateValue(prevData, nextData, "paper", currentDate),
        plastic: interpolateValue(prevData, nextData, "plastic", currentDate),
        organic: interpolateValue(prevData, nextData, "organic", currentDate),
        glass: interpolateValue(prevData, nextData, "glass", currentDate),
      }

      result.push(newEntry)
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Sort the result by date
  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Helper function to find the closest previous data point
function findClosestPreviousData(data: any[], date: Date) {
  const dateTime = date.getTime()
  let closest = null
  let closestDiff = Number.POSITIVE_INFINITY

  for (const item of data) {
    const itemDate = new Date(item.date)
    const diff = dateTime - itemDate.getTime()

    if (diff > 0 && diff < closestDiff) {
      closest = item
      closestDiff = diff
    }
  }

  return closest
}

// Helper function to find the closest next data point
function findClosestNextData(data: any[], date: Date) {
  const dateTime = date.getTime()
  let closest = null
  let closestDiff = Number.POSITIVE_INFINITY

  for (const item of data) {
    const itemDate = new Date(item.date)
    const diff = itemDate.getTime() - dateTime

    if (diff > 0 && diff < closestDiff) {
      closest = item
      closestDiff = diff
    }
  }

  return closest
}

// Helper function to interpolate values between two data points
function interpolateValue(prevData: any, nextData: any, key: string, date: Date) {
  if (!prevData && !nextData) return 0
  if (!prevData) return nextData[key]
  if (!nextData) return prevData[key]

  const prevDate = new Date(prevData.date)
  const nextDate = new Date(nextData.date)
  const totalDiff = nextDate.getTime() - prevDate.getTime()

  if (totalDiff === 0) return prevData[key]

  const currentDiff = date.getTime() - prevDate.getTime()
  const ratio = currentDiff / totalDiff

  return Math.round(prevData[key] + (nextData[key] - prevData[key]) * ratio)
}

