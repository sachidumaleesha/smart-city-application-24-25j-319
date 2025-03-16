import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import FormData from "form-data"
import axios from "axios"

// Function to upload media and get media ID
async function uploadMedia(imagePath: string) {
  const formData = new FormData()
  formData.append("messaging_product", "whatsapp")
  formData.append("type", "image/jpeg")
  formData.append("file", fs.createReadStream(imagePath))

  const response = await axios.post("https://graph.facebook.com/v22.0/563114116892460/media", formData, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      ...formData.getHeaders(),
    },
  })
  return response.data.id
}

// Function to send template message with image header
async function sendTemplateMessage(mediaId: string, binName: string, fillPercentage: number) {
  const response = await axios({
    url: "https://graph.facebook.com/v22.0/563114116892460/messages",
    method: "post",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to: "94766598143",
      type: "template",
      template: {
        name: "hello_bins",
        language: {
          code: "en",
        },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  id: mediaId,
                },
              },
            ],
          },
        ],
      },
    }),
  })
  return response.data
}

export async function POST(request: Request) {
  try {
    const { binName, fillPercentage } = await request.json()

    // Path to your image - adjust this to your project structure
    // For production, you might want to generate this image dynamically
    const imagePath = path.join(process.cwd(), "public", "images", "bins", "hello_bins.jpeg")

    // Upload media and get media ID
    const mediaId = await uploadMedia(imagePath)

    // Send template message
    const result = await sendTemplateMessage(mediaId, binName, fillPercentage)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("WhatsApp API error:", error.response?.data || error.message)
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 })
  }
}

