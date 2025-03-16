import BinLidControl from "../_components/bin-lid-control";
import BinData from "../_components/bin-data/bin-data";
import { BinAnalyticsDashboard } from "../_components/analytics-data/bin-analytics-dashboard";
import { WasteAnalyticsChart } from "../_components/analytics-data/waste-analytics-chart";
import { BinFillAreaChart } from "../_components/analytics-data/bin-fill-area-chart";

export default function AnalyticsPage() {
  return (
    <main className="container mx-auto">
      <BinData/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* <WasteAnalyticsChart/> */}
        <BinFillAreaChart/>
        <BinLidControl />
      </div>
      
    </main>
  );
}
