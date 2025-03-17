"use client";

export default function LiveParkingStream() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Live Parking Feed</h1>
      <iframe 
        src="http://127.0.0.1:5000/api/spacePicker/live" 
        className="w-full max-w-2xl h-[500px] border rounded-lg shadow-lg"
        allowFullScreen
      ></iframe>
    </div>
  );
}
