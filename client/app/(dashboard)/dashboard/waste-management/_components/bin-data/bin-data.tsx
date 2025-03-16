"use client";

import { useState, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import BinFillLevel from "./bin-fill-level";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Define the API URL - change this to your Raspberry Pi's IP address
const API_URL = "http://192.168.1.103:9000";

// Define the bin data type
interface BinData {
  distance: number;
  timestamp: number;
}

interface BinsData {
  paper: BinData;
  plastic: BinData;
  organic: BinData;
  glass: BinData;
}

export default function BinData() {
  const [binData, setBinData] = useState<BinsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.IO connection and set up event listeners
  useEffect(() => {
    // Initial data fetch via HTTP (fallback)
    const fetchInitialData = async () => {
      try {
        // Try to get data from Supabase first
        const response = await fetch("/api/bin-levels");
        const { success, data } = await response.json();

        if (success && data && data.length > 0) {
          // Convert Supabase data format to our app format
          const formattedData: BinsData = {
            paper: { distance: 0, timestamp: 0 },
            plastic: { distance: 0, timestamp: 0 },
            organic: { distance: 0, timestamp: 0 },
            glass: { distance: 0, timestamp: 0 },
          };

          // Map the data from Supabase to our format
          data.forEach((record: any) => {
            if (formattedData[record.binType as keyof BinsData]) {
              formattedData[record.binType as keyof BinsData] = {
                distance: record.distance,
                timestamp: new Date(record.createdAt).getTime(),
              };
            }
          });

          setBinData(formattedData);
          setLoading(false);
          setLastUpdated(new Date().toLocaleTimeString());
          return;
        }

        // Fallback to Raspberry Pi API if no Supabase data
        const piResponse = await fetch(`${API_URL}/api/bins`);

        if (!piResponse.ok) {
          throw new Error(`HTTP error! Status: ${piResponse.status}`);
        }

        const piData = await piResponse.json();
        setBinData(piData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching initial bin data:", err);
        // Don't set error yet, as Socket.IO might still connect
      }
    };

    fetchInitialData();

    // Set up Socket.IO connection
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    // Socket.IO event handlers
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setError(
        "Failed to connect to the server. Check if the Flask server is running."
      );
      setIsConnected(false);
      setLoading(false);
    });

    socket.on("bin_data_update", (data: BinsData) => {
      console.log("Received bin data update:", data);
      setBinData(data);
      setLoading(false);

      // Format the current time for display
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString());
    });

    // Set up Supabase real-time subscription for all bin types
    const subscription = supabase
      .channel("bin-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "BinFillLevel",
        },
        (payload) => {
          console.log("New bin data from Supabase:", payload);
          // Update last updated timestamp
          setLastUpdated(new Date().toLocaleTimeString());

          // We don't update binData here because that would conflict with
          // the Socket.IO updates. The individual BinFillLevel components
          // handle their own real-time updates.
        }
      )
      .subscribe();

    // Clean up on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <main className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Waste Management Analytics</h1>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center text-green-600">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="text-sm">Live</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="text-sm">Offline</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated}` : ""}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">{error}</p>
              <p className="text-sm text-red-700 mt-1">
                Make sure your Flask backend is running and accessible at{" "}
                {API_URL}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Loading bin data...</p>
        </div>
      )}

      {/* Bin data display */}
      {binData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <BinFillLevel
              binName="Paper Bin"
              distance={binData.paper.distance}
              binHeight={11.6}
            />
            <BinFillLevel
              binName="Plastic Bin"
              distance={binData.plastic.distance}
              binHeight={10.9}
            />
            <BinFillLevel
              binName="Organic Bin"
              distance={binData.organic.distance}
              binHeight={9.9}
            />
            <BinFillLevel
              binName="Glass Bin"
              distance={binData.glass.distance}
              binHeight={11.2}
            />
          </div>

          {/* Database update indicator */}
          <div className="text-xs text-muted-foreground text-center mb-4">
            <span>Database updates throttled to 5-second intervals</span>
            <div className="inline-block ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </>
      )}
    </main>
  );
}