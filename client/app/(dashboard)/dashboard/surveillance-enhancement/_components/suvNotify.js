import axios from "axios";

export async function POST(request) {
  try {
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

    return new Response(JSON.stringify(response.data), { status: 200 });
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({ error: "Failed to send WhatsApp notification" }),
      { status: 500 }
    );
  }
}