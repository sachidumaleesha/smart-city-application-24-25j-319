import BillingTable from "@/components/billing-table";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🚗 Parking Billing Dashboard</h1>
      <BillingTable />
    </div>
  );
}
