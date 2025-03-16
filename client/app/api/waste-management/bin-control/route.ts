import { NextResponse } from "next/server"
import {prisma} from "@/lib/db"

// Helper function to convert BigInt values to numbers
function serializeBigInt(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === "bigint") {
    return Number(data)
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInt(item))
  }

  if (typeof data === "object") {
    const result: Record<string, any> = {}
    for (const key in data) {
      result[key] = serializeBigInt(data[key])
    }
    return result
  }

  return data
}

// This is a serverless function that will proxy requests to your Raspberry Pi
// with additional check for bin fill level
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const bin = formData.get("bin") as string
    const position = formData.get("position") as string

    // Validate inputs
    if (
      !bin ||
      !position ||
      !["paper", "plastic", "organic", "glass"].includes(bin) ||
      !["open", "close"].includes(position)
    ) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    // If trying to open the bin, check fill level first
    if (position === "open") {
      try {
        // Get the latest fill level for this bin
        const latestRecord = await prisma.$queryRaw`
          WITH ranked_bins AS (
            SELECT 
              *,
              ROW_NUMBER() OVER (PARTITION BY "binType" ORDER BY "createdAt" DESC) as rn
            FROM "BinFillLevel"
            WHERE "binType" = ${bin}
          )
          SELECT * FROM ranked_bins WHERE rn = 1
        `

        // Serialize BigInt values
        const serializedRecord = serializeBigInt(latestRecord)

        // Check if bin is too full (80% or more)
        if (Array.isArray(serializedRecord) && serializedRecord.length > 0) {
          const binData = serializedRecord[0] as any
          if (binData.fillPercent >= 80) {
            return NextResponse.json(
              {
                error: "Bin too full",
                message: "Cannot open bin that is 80% or more full",
                fillLevel: binData.fillPercent,
              },
              { status: 403 },
            )
          }
        }
      } catch (error) {
        console.error("Error checking bin fill level:", error)
        // Continue with the operation if we can't check the fill level
        // This is a fallback in case the database query fails
      }
    }

    // Forward the request to your Raspberry Pi
    const raspberryPiUrl = process.env.RASPBERRY_PI_URL || "http://192.168.1.103:5000"

    const response = await fetch(`${raspberryPiUrl}/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `bin=${bin}&position=${position}`,
    })

    if (!response.ok) {
      throw new Error(`Failed to control bin: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error controlling bin:", error)
    return NextResponse.json({ error: "Failed to control bin" }, { status: 500 })
  }
}