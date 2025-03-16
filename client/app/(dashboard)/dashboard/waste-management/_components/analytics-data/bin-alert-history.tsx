"use client"

import type { BinFillLevel } from "@prisma/client"
import { format } from "date-fns"
import { AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface BinAlertHistoryProps {
  data: BinFillLevel[]
}

export function BinAlertHistory({ data }: BinAlertHistoryProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4 text-muted-foreground/50" />
        <p>No alerts recorded in the selected time period.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Bin Type</TableHead>
            <TableHead>Fill Level</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell className="font-medium">{format(new Date(alert.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getBinColor(alert.binType) }} />
                  {alert.binType.charAt(0).toUpperCase() + alert.binType.slice(1)}
                </div>
              </TableCell>
              <TableCell>{alert.fillPercent.toFixed(1)}%</TableCell>
              <TableCell>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Critical
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Helper function to get color based on bin type
function getBinColor(binType: string): string {
  switch (binType.toLowerCase()) {
    case "paper":
      return "#EAB308" // yellow
    case "plastic":
      return "#EF4444" // red
    case "organic":
      return "#22C55E" // green
    case "glass":
      return "#3B82F6" // blue
    default:
      return "#6B7280" // gray
  }
}