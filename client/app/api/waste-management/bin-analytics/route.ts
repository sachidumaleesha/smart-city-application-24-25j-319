import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Get data from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const analyticsData = await prisma.binFillLevel.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        binType: true,
        fillPercent: true,
        createdAt: true,
      },
    })

    // Transform data for the frontend
    const formattedData = analyticsData.map((record) => ({
      binType: record.binType,
      fillPercent: record.fillPercent,
      timestamp: record.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
    })
  } catch (error) {
    console.error("Error fetching bin analytics data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch analytics data" }, { status: 500 })
  }
}