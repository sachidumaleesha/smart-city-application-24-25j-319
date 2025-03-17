"use client"

import React, { useState, useEffect } from "react"

const SurveillanceEnhancementPage = () => {
  const [feedStarted, setFeedStarted] = useState(false);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [suspiciousImages, setSuspiciousImages] = useState<string[]>([]);

  const handleStartFeed = async () => {
    try {
      const res = await fetch("http://localhost:5000/cctv/start", { method: "POST" });
      const data = await res.json();
      console.log("Start feed:", data);
      setFeedStarted(true);
    } catch (error) {
      console.error("Error starting feed", error);
    }
  };

  const handleStopFeed = async () => {
    try {
      const res = await fetch("http://localhost:5000/cctv/stop", { method: "POST" });
      const data = await res.json();
      console.log("Stop feed:", data);
      setFeedStarted(false);
    } catch (error) {
      console.error("Error stopping feed", error);
    }
  };

  const sendWhatsappMessage = async () => {
    try {
      // Call snapshot API and get snapshot data
      const snapshotRes = await fetch("http://localhost:5000/cctv/snapshot", { method: "GET" });
      const snapshotData = await snapshotRes.json();
      console.log("Snapshot:", snapshotData);
      
      // If snapshot API returns an image_url, add it to the suspiciousImages array.
      if (snapshotData.image_url) {
        setSuspiciousImages(prev => [...prev, snapshotData.image_url]);
      }

      // Inline WhatsApp notification logic (custom text message)
      const PHONE_NUMBER_ID = "628213070365635";
      const WHATSAPP_TOKEN = "EAAX4cUkrZCcsBOZCvphxM0ZAOxMfvvSWsXq8RxEIIbCOI6kr64EeZAC2JdohDV2LEX1bipLWaZAKb1TgYd0Jq4lox0RdZCoREuSa3iZCxfwLgsKYULEoZB16wJAnt1DLuMbM28zotkjaT0qHYqGLX1joriYNx8o5k8SzDvcYN2rUOvyxvMNgNWsQFXX7YaOrIwQjD2PRgmFxXs7QgOyequdtEgILnbZBm";
      const RECIPIENT_NUMBER = "94705195786";

      if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN || !RECIPIENT_NUMBER) {
        throw new Error("Missing WhatsApp configuration in environment variables");
      }

      const whatsappRes = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: RECIPIENT_NUMBER,
          type: "text",
          text: {
            body: "Alert ⚠️: Suspicious activity detected. Please check your surveillance system immediately."
          }
        })
      });
      const whatsappData = await whatsappRes.json();
      console.log("WhatsApp notification sent:", whatsappData);
    } catch (error) {
      console.error("Error taking snapshot or sending WhatsApp notification", error);
    }
  };

  // Poll suspicious count every 5 seconds and trigger WhatsApp if suspiciousCount > 40
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5000/cctv/suspicious");
        const { suspicious_count } = await res.json();
        setSuspiciousCount(suspicious_count);
        if (suspicious_count > 40) {
          setAlertMessage("Warning: High number of suspicious activity detected!");
          // Send WhatsApp notification and capture suspicious snapshot
          await sendWhatsappMessage();
          // Reset server suspicious_count by calling the reset endpoint
          await fetch("http://localhost:5000/cctv/reset", { method: "POST" });
          // Reset local count as well
          setSuspiciousCount(0);
        } else {
          setAlertMessage("");
        }
      } catch (error) {
        console.error("Error fetching suspicious count", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">CCTV Control Panel</h1>
      <div className="space-x-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none transition"
          onClick={handleStartFeed}
        >
          Start Feed
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none transition"
          onClick={handleStopFeed}
        >
          Stop Feed
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none transition"
          onClick={sendWhatsappMessage}
        >
          Snapshot
        </button>
      </div>
      {alertMessage && (
        <div className="mb-4 p-4 bg-yellow-200 text-yellow-800 rounded">
          {alertMessage}
        </div>
      )}
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg overflow-hidden">
        {feedStarted ? (
          <img
            src="http://localhost:5000/cctv/video_feed"
            alt="Live CCTV Feed"
            className="w-full"
          />
        ) : (
          <div className="p-6 text-center">
            <p className="text-lg text-gray-500">
              Camera feed will appear here when started.
            </p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Suspicious activity detections: {suspiciousCount}
        </p>
      </div>
      {/* Render suspicious activity snapshots as a list of images */}
      {suspiciousImages.length > 0 && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Suspicious Activity Snapshots</h2>
          <div className="grid grid-cols-2 gap-4">
            {suspiciousImages.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`Suspicious snapshot ${index + 1}`}
                className="w-full object-cover rounded border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveillanceEnhancementPage;