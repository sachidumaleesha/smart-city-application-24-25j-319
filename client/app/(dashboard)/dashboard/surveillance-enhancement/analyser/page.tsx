"use client"

import { useState } from "react"

export default function YouTubeAnalyser() {
  const [videoUrl, setVideoUrl] = useState("")
  const [result, setResult] = useState("")
  const [prediction, setPrediction] = useState<number | null>(null)
  const [timestamp, setTimestamp] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDetect = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:5000/youtube/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: videoUrl })
      })
      const data = await res.json()
      if (data.error) {
        setResult(data.error)
      } else {
        setResult(data.result)
        setPrediction(data.prediction)
        setTimestamp(data.timestamp)
      }
    } catch (err) {
      setResult("Error calling detection")
    } finally {
      setLoading(false)
    }
  }

  // Conditional className for the result text.
  const resultClass = result === "Suspicious Activity Detected!"
    ? "text-red-500 font-semibold"
    : result === "Normal Activity"
      ? "text-green-500 font-semibold"
      : "text-gray-600"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-xl w-full">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">YouTube Suspicious Detector</h2>
        <div className="mb-5">
          <input
            type="text"
            placeholder="Enter YouTube URL"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value)
              // Clear previous detection results when entering a new URL
              setResult("")
              setPrediction(null)
              setTimestamp("")
            }}
            className="w-full p-3 border rounded outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-5 flex justify-center">
          <button
            onClick={handleDetect}
            disabled={loading || !videoUrl}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          >
            {loading ? "Detecting..." : "Detect Suspicious Activity"}
          </button>
        </div>
        {result && (
          <div className="mb-6 border-t pt-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Detection Result:</h3>
            <p className={resultClass}>{result}</p>
            {prediction !== null && (
              <p className="text-gray-600">Prediction Score: <span className="font-mono">{prediction}</span></p>
            )}
            {/* {timestamp && <p className="text-gray-600">Timestamp: {timestamp}</p>} */}
          </div>
        )}
        {videoUrl && getYouTubeID(videoUrl) && (
          <div className="relative pb-[56.25%] mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeID(videoUrl)}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube Video"
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function getYouTubeID(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : ""
}