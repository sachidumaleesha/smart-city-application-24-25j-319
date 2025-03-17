"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import FileUpload from "../_components/file-upload"
import BinDisplay from "../_components/bin-display"

export default function WasteManagementPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<{ class: string; confidence: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile)
    setPrediction(null)
    setError(null)

    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleClassify = async () => {
    if (!file) {
      setError("Please upload an image first")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("https://web-production-08d02.up.railway.app/api/wasteManagement/predict", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const result = await response.json()
      console.log(result)
      setPrediction(result)
    } catch (err) {
      setError(`Failed to classify image: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setPrediction(null)
    setError(null)
  }

  return (
    <main className="container mx-auto py-8 px-4">
      {/* <h1 className="text-3xl font-bold text-center mb-8">Smart Waste Management</h1>
      <p className="text-center text-muted-foreground mb-8">
        Upload an image of waste to classify and identify the correct bin
      </p> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload and Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Waste Image</CardTitle>
              <CardDescription>Supported formats: JPG, JPEG, PNG</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFileChange={handleFileChange} preview={preview} />

              <div className="flex gap-4 mt-6">
                <Button onClick={handleClassify} disabled={!file || isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Classifying...
                    </>
                  ) : (
                    <>Classify Waste</>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} className="flex-none">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {prediction && (
            <Card>
              <CardHeader>
                <CardTitle>Classification Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Waste Type:</span>
                    <span className="capitalize font-bold">{prediction.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Confidence:</span>
                    <span>{(prediction.confidence * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Bins */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Waste Bins</CardTitle>
              <CardDescription>The correct bin will open based on the classification</CardDescription>
            </CardHeader>
            <CardContent>
              <BinDisplay activeClass={prediction?.class || null} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}