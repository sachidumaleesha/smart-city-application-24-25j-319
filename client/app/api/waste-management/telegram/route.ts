import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { binName, fillPercentage } = await request.json()

    // Get the Telegram bot token and chat ID from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Telegram configuration",
        },
        { status: 500 },
      )
    }

    // Craft the message
    const message = `🚨 Alert: Bin "${binName}" is now ${fillPercentage}% full and requires attention.`

    // Send the message to Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const telegramData = await telegramResponse.json()

    if (!telegramData.ok) {
      return NextResponse.json(
        {
          success: false,
          error: telegramData.description,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending Telegram message:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send Telegram message",
      },
      { status: 500 },
    )
  }
}

