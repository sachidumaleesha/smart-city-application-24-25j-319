import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert BigInt values to numbers for JSON serialization
export function serializeBigInt(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === "bigint") {
    return Number(data)
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInt(item))
  }

  if (typeof data === "object") {
    const result: Record<string, any> = {}
    for (const key in data) {
      result[key] = serializeBigInt(data[key])
    }
    return result
  }

  return data
}