"use client";

import { useState, useEffect } from "react";

interface AccidentFrame {
  frame_number: number;
  frame: string; // base64 encoded image
}

const YouTubeDetectionPage = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [accidents, setAccidents] = useState<AccidentFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [whatsappAlertSent, setWhatsappAlertSent] = useState(false);

  // ✅ Extract video ID from YouTube link
  const getEmbeddedYouTubeUrl = (url: string): string => {
    if (!url) return "";

    const videoIdMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : "";

    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
      : "";
  };

  // ✅ Analyze YouTube Video
  const handleAnalyze = async () => {
    if (!youtubeUrl) {
      alert("Please enter a YouTube link!");
      return;
    }

    setLoading(true);
    setAccidents([]);
    setWhatsappAlertSent(false);

    try {
      const response = await fetch(
        "http://localhost:5000/api/youtubeDetection/analyze-youtube",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtubeUrl }),
        }
      );

      const data = await response.json();

      if (data.accidents_detected) {
        setAccidents(data.frames);
        // ✅ Automatically send WhatsApp alert after detection
        sendWhatsAppAlert(data.frames);
      } else {
        alert("✅ No accidents detected in this video!");
      }
    } catch (error) {
      console.error("Error analyzing YouTube video:", error);
      alert("❌ Failed to analyze the video.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Send WhatsApp Message after accident frames are detected
  const sendWhatsAppAlert = async (frames: AccidentFrame[]) => {
    if (!frames || frames.length === 0) {
      console.log("❌ No accident frames to send.");
      return;
    }

    if (whatsappAlertSent) {
      console.log("⏳ WhatsApp alert already sent.");
      return;
    }

    try {
      const firstFrame = frames[0].frame; // send the first frame as the image
      const messageText = `🚨 Accident Alert! Multiple accidents detected in the analyzed YouTube video.\n\nDetected Frames: ${frames.length}`;

      const response = await fetch("/api/send-whatsapp-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "94742605606", // Replace with your WhatsApp number
          message: messageText,
          frameBase64: firstFrame, // Send one sample image as frame
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ WhatsApp alert sent successfully.");
        setWhatsappAlertSent(true);
        alert("🚀 Accident alert sent to WhatsApp!");
      } else {
        console.error("❌ Failed to send WhatsApp alert:", data.error);
      }
    } catch (error) {
      console.error("❌ Error sending WhatsApp alert:", error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">🎥 YouTube Accident Detection Test</h1>

      <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow-md">
        <label className="block mb-2 font-semibold">Paste YouTube Video Link:</label>
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading || !youtubeUrl}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Video"}
        </button>
      </div>

      {/* YouTube Player */}
      {youtubeUrl && (
        <div className="mt-8 w-full max-w-4xl aspect-video">
          <iframe
            src={getEmbeddedYouTubeUrl(youtubeUrl)}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg shadow-lg"
          ></iframe>
        </div>
      )}

      {/* Accident Frames */}
      {accidents.length > 0 && (
        <div className="mt-10 w-full max-w-4xl">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            🚨 Detected Accident Frames
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accidents.map((frame, index) => (
              <div
                key={index}
                className="border bg-white rounded-lg shadow-md overflow-hidden"
              >
                <p className="p-2 font-semibold bg-red-100 text-center">
                  Frame #{frame.frame_number}
                </p>
                <img
                  src={`data:image/jpeg;base64,${frame.frame}`}
                  alt={`Accident Frame ${index + 1}`}
                  className="w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeDetectionPage;
