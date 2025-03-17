
"use client";

import { useEffect, useState, useRef } from "react";

const cameras = ["Kaduwela", "Malabe", "Welivita", "Pittugala"];
const ALERT_INTERVAL = 30 * 1000; // 30 seconds cooldown

const AccidentDetectionPage = () => {
  const [alerts, setAlerts] = useState<{ camera: string; frame: string }[]>([]);
  const lastAlertTime = useRef(0); // 🔥 Fix: Use useRef to persist cooldown time

  const sendWhatsAppAlert = async (camera: string, frameBase64: string) => {
    const currentTime = Date.now();

    if (currentTime - lastAlertTime.current < ALERT_INTERVAL) {
      console.log(
        `⏳ Cooldown active: Skipping WhatsApp alert (Remaining: ${
          (ALERT_INTERVAL - (currentTime - lastAlertTime.current)) / 1000
        }s)`
      );
      return;
    }

    if (!camera || !frameBase64) {
      console.error("❌ Missing required parameters for WhatsApp Alert", {
        camera,
        frameBase64,
      });
      return;
    }

    try {
      const response = await fetch("/api/send-whatsapp-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "94742605606",
          message: `🚨 Accident Alert! An accident has been detected at ${camera}. Please check immediately!`,
          frameBase64, // Ensure this is not undefined
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("✅ WhatsApp Alert Sent Successfully");
        lastAlertTime.current = currentTime; // 🔥 Fix: Correctly store the last alert time
      } else {
        console.error("❌ Error sending WhatsApp Alert", data.error);
      }
    } catch (error) {
      console.error("❌ Failed to send WhatsApp alert", error);
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/accidentDetection/alerts"
        );
        const data = await response.json();

        if (data.alerts.length > 0) {
          setAlerts(data.alerts);

          const firstAlert = data.alerts[0];
          if (firstAlert.frame) {
            sendWhatsAppAlert(firstAlert.camera, firstAlert.frame);
          } else {
            console.error("🚨 No frame data found in alert!");
          }
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6 mb-4">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        🚨 Real-Time Multi-Camera Accident Detection
      </h1>
      <div className="grid grid-cols-2 gap-4">
        {cameras.map((camera) => (
          <div
            key={camera}
            className="border rounded-lg overflow-hidden shadow-lg"
          >
            <h2 className="text-center font-semibold bg-gray-200 py-2">
              {camera}
            </h2>
            <img
              src={`http://localhost:5000/api/accidentDetection/stream/${camera}`}
              className="w-full h-auto"
              alt={`${camera} Stream`}
            />
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-4xl w-full">
          <strong className="font-bold">Accident Alert!</strong>
          <ul>
            {alerts.map((alert, index) => (
              <li key={index} className="mt-2">
                📍 Accident detected in <strong>{alert.camera}</strong> 🚨
                <img
                  src={`data:image/jpeg;base64,${alert.frame}`}
                  className="mt-2 w-64 rounded"
                  alt="Accident Frame"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccidentDetectionPage;
