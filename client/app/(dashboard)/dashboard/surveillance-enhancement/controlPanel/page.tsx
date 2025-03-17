"use client"

import React, { useState, useEffect } from "react"

const SurveillanceEnhancementPage = () => {
  const [feedStarted, setFeedStarted] = useState(false)
  const [suspiciousCount, setSuspiciousCount] = useState(0)
  const [alertMessage, setAlertMessage] = useState("")
  const [suspiciousImages, setSuspiciousImages] = useState<string[]>([])

  // These constants should be set from your configuration
  const PHONE_NUMBER_ID = "628213070365635"
  const WHATSAPP_TOKEN = "EAA4qcvtPL78BO9kERQMaIKl0sF7Q3nAmguPAQbnezj3y5WYnBEZAeKK4TbFOS3OPJ7BMBcTCpk63C1ZAyalSlKDP249wrsx1vXJMK8pixG99NIGLaGpXM3ujbaerfDkZCHZCN80g7s4q7eLXKXtbhWGZAMUfpe6wdvDf5FTaDb9bXIqGi57sZAIxIlpcRoPjrvAVcliX2XAKBeI58mpANYF6lkZCw0ZD"
  const RECIPIENT_NUMBER = "94705195786"

  const handleStartFeed = async () => {
    try {
      const res = await fetch("http://localhost:5000/cctv/start", { method: "POST" })
      const data = await res.json()
      console.log("Start feed:", data)
      setFeedStarted(true)
    } catch (error) {
      console.error("Error starting feed", error)
    }
  }

  const handleStopFeed = async () => {
    try {
      const res = await fetch("http://localhost:5000/cctv/stop", { method: "POST" })
      const data = await res.json()
      console.log("Stop feed:", data)
      setFeedStarted(false)
    } catch (error) {
      console.error("Error stopping feed", error)
    }
  }

  // Function to send WhatsApp message with snapshot image
  const sendWhatsappMessage = async () => {
    try {
      // Get snapshot data from snapshot API
      const snapshotRes = await fetch("http://localhost:5000/cctv/snapshot", { method: "GET" })
      const snapshotData = await snapshotRes.json()
      console.log("Snapshot:", snapshotData)
      
      let payload

      if (snapshotData.image_url) {
        // Update state so snapshot can be rendered in UI if desired
        setSuspiciousImages(prev => [...prev, snapshotData.image_url])
        
        // Fetch the image as a blob and upload it to WhatsApp
        const imageRes = await fetch(snapshotData.image_url)
        const imageBlob = await imageRes.blob()
  
        const formData = new FormData()
        formData.append("file", imageBlob, "snapshot.png")
        formData.append("type", "image/png")
        formData.append("messaging_product", "whatsapp")
  
        // Upload media to WhatsApp
        const mediaUploadRes = await fetch(
          `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/media`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            },
            body: formData,
          }
        )
        const mediaUploadData = await mediaUploadRes.json()
        console.log("Media upload response:", mediaUploadData)
  
        if (!mediaUploadData.id) {
          throw new Error("Media upload failed. No media id returned.")
        }
  
        // Prepare payload using the media id
        payload = {
          messaging_product: "whatsapp",
          to: RECIPIENT_NUMBER,
          type: "image",
          image: {
            id: mediaUploadData.id,
            caption:
              "Alert ⚠️: Suspicious activity detected. Please check your surveillance system immediately.",
          },
        }
      } else {
        // Fallback to text message
        payload = {
          messaging_product: "whatsapp",
          to: RECIPIENT_NUMBER,
          type: "text",
          text: {
            body:
              "Alert ⚠️: Suspicious activity detected. Please check your surveillance system immediately.",
          },
        }
      }
  
      // Send WhatsApp message via Facebook Graph API
      const whatsappRes = await fetch(
        `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )
      const whatsappData = await whatsappRes.json()
      console.log("WhatsApp notification sent:", whatsappData)
    } catch (error) {
      console.error("Error taking snapshot or sending WhatsApp notification", error)
    }
  }

  // Poll the suspicious count every 5 seconds and trigger WhatsApp automatically if > 40
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5000/cctv/suspicious")
        const { suspicious_count } = await res.json()
        setSuspiciousCount(suspicious_count)
        if (suspicious_count > 40) {
          setAlertMessage("Warning: High number of suspicious activity detected!")
          await sendWhatsappMessage()
          // Optionally reset the suspicious count on the server
          await fetch("http://localhost:5000/cctv/reset", { method: "POST" })
          setSuspiciousCount(0)
        } else {
          setAlertMessage("")
        }
      } catch (error) {
        console.error("Error fetching suspicious count", error)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
        {/* Snapshot button remains available for manual triggering */}
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
            <p className="text-lg text-gray-500">Camera feed will appear here when started.</p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">Suspicious activity detections: {suspiciousCount}</p>
      </div>
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
  )
}

export default SurveillanceEnhancementPage