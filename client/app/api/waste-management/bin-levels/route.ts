import { NextResponse } from "next/server"
import {prisma} from "@/lib/db"
import { serializeBigInt } from "@/lib/utils"

// Save bin fill level data
export async function POST(req: Request) {
  try {
    const { binType, distance, fillPercent, binHeight, isAlert } = await req.json()

    // Save to database using Prisma
    const binData = await prisma.binFillLevel.create({
      data: {
        binType,
        distance,
        fillPercent,
        binHeight,
        isAlert,
      },
    })

    // If this is an alert, also save to alert history
    // if (isAlert) {
    //   await prisma.binAlertHistory.create({
    //     data: {
    //       binType,
    //       fillPercent,
    //       alertSent: true,
    //     },
    //   })
    // }

    return NextResponse.json({
      success: true,
      data: binData,
      timestamp: new Date().toISOString(),
      message: "Data saved with 5-second throttling",
    })
  } catch (error: any) {
    console.error("Error saving bin data:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Get latest bin fill levels
export async function GET() {
  try {
    // Get the latest record for each bin type
    const latestRecords = await prisma.$queryRaw`
      WITH ranked_bins AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (PARTITION BY "binType" ORDER BY "createdAt" DESC) as rn
        FROM "BinFillLevel"
      )
      SELECT * FROM ranked_bins WHERE rn = 1
    `

    // Serialize BigInt values to numbers before returning as JSON
    const serializedRecords = serializeBigInt(latestRecords)

    return NextResponse.json({ success: true, data: serializedRecords })
  } catch (error: any) {
    console.error("Error fetching bin data:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}