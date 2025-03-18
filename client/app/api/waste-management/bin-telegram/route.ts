import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { binName, openDuration } = await request.json();
    console.log(`API received request to send Telegram alert for ${binName} bin open for ${openDuration} minutes`);
    
    // Get the Telegram bot token and chat ID from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.error('Missing Telegram configuration: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing Telegram configuration' 
      }, { status: 500 });
    }
    
    // Craft the message
    const message = `⚠️ Warning: ${binName} bin has been open for ${openDuration} minute${openDuration > 1 ? 's' : ''}. Please close the bin lid to prevent odors and pests.`;
    console.log(`Sending message to Telegram: ${message}`);
    
    // Send the message to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    console.log(`Sending request to: ${telegramUrl}`);
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
    
    const telegramData = await telegramResponse.json();
    console.log('Telegram API response:', telegramData);
    
    if (!telegramData.ok) {
      console.error('Telegram API error:', telegramData.description);
      return NextResponse.json({ 
        success: false, 
        error: telegramData.description 
      }, { status: 500 });
    }
    
    console.log('Telegram message sent successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send Telegram message' 
    }, { status: 500 });
  }
}