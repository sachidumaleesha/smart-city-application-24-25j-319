import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Ensure that these environment variables are defined in your .env.local file at the project root.
    // They should NOT be prefixed with NEXT_PUBLIC_ if they are meant to be secret.
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
    const RECIPIENT_NUMBER = process.env.RECIPIENT_NUMBER;

    const response = await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: "post",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      data: {
        messaging_product: "whatsapp",
        to: RECIPIENT_NUMBER,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" }
        }
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to send WhatsApp notification" });
  }
}