"use client";

import { useState } from "react";

const WhatsAppSender = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");

    const sendMessage = async () => {
        if (!phoneNumber || !message) {
            setStatus("❌ Please enter both phone number and message.");
            return;
        }

        try {
            setStatus("⏳ Sending...");
            const response = await fetch("/api/send-whatsapp-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber, message }),
            });

            const data = await response.json();
            if (data.success) {
                setStatus("✅ Message sent successfully!");
            } else {
                setStatus(`❌ Error: ${data.error.message || "Failed to send message"}`);
            }
        } catch (error) {
            setStatus("❌ Failed to send message.");
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold mb-4">📩 Send WhatsApp Message</h1>

            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
                <label className="block font-semibold">📞 Phone Number:</label>
                <input
                    type="text"
                    placeholder="94742605606"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border p-2 rounded mt-2 mb-4"
                />

                <label className="block font-semibold">💬 Message:</label>
                <textarea
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border p-2 rounded mt-2 mb-4"
                    rows={4}
                />

                <button
                    onClick={sendMessage}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                    📤 Send Message
                </button>

                {status && <p className="mt-4 text-center text-red-500">{status}</p>}
            </div>
        </div>
    );
};

export default WhatsAppSender;
