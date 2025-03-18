"use client";

import { useRef, useState } from "react";

export default function ANPRPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [plateNumber, setPlateNumber] = useState("");
  const [driver, setDriver] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState(""); // success, error, warning

  const registeredUsers = [
    {
      driverName: "Driver One",
      vehicleNumber: "9024",
      whatsappNumber: "94784522840",
    },
    {
      driverName: "Driver Two",
      vehicleNumber: "9597",
      whatsappNumber: "94742605606",
    },
  ];

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    }
  };

  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");

    try {
      setIsLoading(true);
      setAlertMessage("");
      setAlertType("");
      setPlateNumber("");
      setDriver("");
      setEntryTime("");

      const res = await fetch("http://127.0.0.1:5000/api/anpr/detect_plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await res.json();
      console.log("Plate Detection Response:", data);

      if (data.status === "success") {
        const currentTime = data.entry_time;

        setAlertMessage(`✅ Access granted to ${data.driver}`);
        setAlertType("success");
        setPlateNumber(data.plate_number);
        setDriver(data.driver);
        setEntryTime(currentTime);

        const user = registeredUsers.find(
          (u) => u.vehicleNumber === data.plate_number
        );

        if (user) {
          await sendWhatsAppMessage(user.whatsappNumber, user.driverName, currentTime);
        }

      } else if (data.status === "unauthorized") {
        setAlertMessage("❌ Unauthorized vehicle detected!");
        setAlertType("warning");
        setPlateNumber(data.plate_number);
        setDriver("");
        setEntryTime("");
      } else {
        setAlertMessage(data.message || "No number detected");
        setAlertType("error");
      }

    } catch (error) {
      console.error("API Error:", error);
      setAlertMessage("❌ Server error");
      setAlertType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const sendWhatsAppMessage = async (
    phoneNumber: string,
    driverName: string,
    time: string
  ) => {
    try {
      const messageText = `🚗 Welcome ${driverName}!\n✅ Your vehicle has been granted access.\n🕒 Entry Time: ${time}`;

      const response = await fetch("/api/parking-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          message: messageText,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ WhatsApp message sent successfully", result);
      } else {
        console.error("❌ Failed to send WhatsApp message", result.error);
      }
    } catch (error) {
      console.error("❌ Error sending WhatsApp message:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6"> ANPR Detection & Gate Control</h1>

      <video ref={videoRef} autoPlay playsInline muted className="w-[440px] h-[280px] border" />
      <canvas ref={canvasRef} width="440" height="280" hidden />

      <div className="flex gap-4 mt-6">
        <button
          onClick={startCamera}
          disabled={isCameraOn}
          className={`px-6 py-3 rounded-lg ${
            isCameraOn ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {isCameraOn ? "Camera On" : "Start Camera"}
        </button>

        <button
          onClick={captureImage}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white ${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Checking..." : "Capture & Detect"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg shadow-md w-[400px] text-center">
        <h2 className="text-xl font-semibold">Detected Plate:</h2>
        <p className="text-2xl text-red-600 mt-2">
          {plateNumber || "No plate detected"}
        </p>

        {driver && (
          <p className="text-md text-gray-700 mt-1">👤 Driver: {driver}</p>
        )}
        {entryTime && (
          <p className="text-md text-gray-700 mt-1">🕒 Entry Time: {entryTime}</p>
        )}
      </div>

      {alertMessage && (
        <div
          className={`mt-4 px-6 py-3 rounded-lg text-white ${
            alertType === "success"
              ? "bg-green-500"
              : alertType === "warning"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        >
          {alertMessage}
        </div>
      )}
    </div>
  );
}
