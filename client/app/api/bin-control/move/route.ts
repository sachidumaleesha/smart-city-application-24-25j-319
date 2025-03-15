import { NextResponse } from "next/server"

// This is a serverless function that will proxy requests to your Raspberry Pi
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

