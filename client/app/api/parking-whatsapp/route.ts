import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      console.error("❌ Missing required parameters", { phoneNumber, message });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN as string;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID as string;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: "Missing WhatsApp credentials" },
        { status: 500 }
      );
    }

    const apiUrl = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: {
        body: message,
      },
    };

    const headers = {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(apiUrl, payload, { headers });

    console.log("✅ WhatsApp message sent:", response.data);

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.error("❌ WhatsApp API Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || "Internal Server Error" },
      { status: 500 }
    );
  }
}
