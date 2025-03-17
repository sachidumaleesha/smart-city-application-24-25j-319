import { NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const { phoneNumber, message, frameBase64 } = await req.json();

        if (!phoneNumber || !message || !frameBase64) {
            console.error("❌ Missing required parameters", { phoneNumber, message, frameBase64 });
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // ✅ Save image temporarily
        const imagePath = path.join("/tmp", `accident_${Date.now()}.jpg`);
        fs.writeFileSync(imagePath, Buffer.from(frameBase64, "base64"));

        // ✅ Upload Image to WhatsApp
        const mediaResponse = await axios.post(
            `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/media`,
            {
                messaging_product: "whatsapp",
                file: fs.createReadStream(imagePath),
                type: "image/jpeg",
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        const mediaId = mediaResponse.data.id;

        // ✅ Send WhatsApp Message with Image
        const messageResponse = await axios.post(
            `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phoneNumber,
                type: "image",
                image: {
                    id: mediaId,
                    caption: message,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ WhatsApp API Response:", messageResponse.data);

        // ✅ Delete Image after sending
        fs.unlinkSync(imagePath);

        return NextResponse.json({ success: true, data: messageResponse.data });
    } catch (error: any) {
        console.error("❌ WhatsApp API Error:", error.response?.data || error.message);
        return NextResponse.json({ error: error.response?.data || "Internal Server Error" }, { status: 500 });
    }
}
