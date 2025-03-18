"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const parkingBills = [
  {
    vehicleNumber: "9024",
    driverName: "Driver One",
    entryTime: "2025-03-18 10:00:00",
    exitTime: "2025-03-18 12:30:00",
    durationHours: 2.5,
    billAmount: 250, // LKR / USD / etc.
    paymentStatus: "Paid",
    paymentMethod: "Cash",
  },
  {
    vehicleNumber: "9597",
    driverName: "Driver Two",
    entryTime: "2025-03-18 09:15:00",
    exitTime: "2025-03-18 11:45:00",
    durationHours: 2.5,
    billAmount: 250,
    paymentStatus: "Pending",
    paymentMethod: "Credit Card",
  },
  {
    vehicleNumber: "7777",
    driverName: "Driver Three",
    entryTime: "2025-03-18 08:00:00",
    exitTime: "2025-03-18 13:00:00",
    durationHours: 5,
    billAmount: 500,
    paymentStatus: "Unpaid",
    paymentMethod: "Bank Transfer",
  },
];

export default function BillingTable() {
  const totalBillAmount = parkingBills.reduce(
    (total, bill) => total + bill.billAmount,
    0
  );

  return (
    <Table>
      <TableCaption>A summary of recent parking bills.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Vehicle</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Entry Time</TableHead>
          <TableHead>Exit Time</TableHead>
          <TableHead>Duration (hrs)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Bill Amount (Rs)</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {parkingBills.map((bill, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{bill.vehicleNumber}</TableCell>
            <TableCell>{bill.driverName}</TableCell>
            <TableCell>{bill.entryTime}</TableCell>
            <TableCell>{bill.exitTime}</TableCell>
            <TableCell>{bill.durationHours}</TableCell>
            <TableCell>{bill.paymentStatus}</TableCell>
            <TableCell>{bill.paymentMethod}</TableCell>
            <TableCell className="text-right">{bill.billAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={7} className="font-bold text-right">
            Total
          </TableCell>
          <TableCell className="text-right font-bold">
            Rs. {totalBillAmount}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
