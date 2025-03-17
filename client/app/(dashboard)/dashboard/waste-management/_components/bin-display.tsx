"use client"
import Image from "next/image"

interface BinDisplayProps {
  activeClass: string | null
}

interface BinInfo {
  name: string
  color: string
  textColor: string
  images: {
    open: string
    closed: string
  }
}

export default function BinDisplay({ activeClass }: BinDisplayProps) {
  // Define bins with their image paths
  const bins: BinInfo[] = [
    {
      name: "organic",
      color: "green",
      textColor: "text-green-800",
      images: {
        closed: "/images/bins/green_bin_lid_closed.jpg",
        open: "/images/bins/green_bin_lid_opened.jpg",
      },
    },
    {
      name: "glass",
      color: "orange",
      textColor: "text-orange-800",
      images: {
        closed: "/images/bins/orange_bin_lid_closed.jpg",
        open: "/images/bins/orange_bin_lid_opened.jpg",
      },
    },
    {
      name: "paper",
      color: "yellow",
      textColor: "text-yellow-800",
      images: {
        closed: "/images/bins/yellow_bin_lid_closed.jpg",
        open: "/images/bins/yellow_bin_lid_opened.jpg",
      },
    },
    {
      name: "plastic",
      color: "red",
      textColor: "text-red-800",
      images: {
        closed: "/images/bins/red_bin_lid_closed.jpg",
        open: "/images/bins/red_bin_lid_opened.jpg",
      },
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-6">
      {bins.map((bin) => {
        // Determine which image to show based on active class
        const imageSrc = activeClass === bin.name ? bin.images.open : bin.images.closed

        return (
          <div key={bin.name} className="flex flex-col items-center">
            <div
              className={`relative w-full aspect-square rounded-lg overflow-hidden border-4 ${
                activeClass === bin.name ? `border-${bin.color}-500` : "border-gray-200"
              }`}
            >
              {/* Use actual bin images */}
              <div className="relative w-full h-full">
                <Image
                  src={imageSrc || "/placeholder.svg"}
                  alt={`${bin.name} bin ${activeClass === bin.name ? "open" : "closed"}`}
                  fill
                  className={`object-cover transition-opacity duration-300 ${
                    activeClass === bin.name ? "animate-pulse" : ""
                  }`}
                  // Fallback to placeholder if image fails to load
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `/placeholder.svg?height=200&width=200&text=${bin.name}`
                  }}
                />
              </div>
            </div>
            <span
              className={`mt-2 font-medium capitalize ${activeClass === bin.name ? bin.textColor : "text-gray-600"}`}
            >
              {bin.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}