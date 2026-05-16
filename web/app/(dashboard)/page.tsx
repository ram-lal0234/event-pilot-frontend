import { Bed, Car, UserCheck, AlertTriangle, Plus } from "lucide-react";
import { StatCard } from "@/components/domain/stat-card";
import { LiveOperationsFeed } from "@/components/domain/dashboard/live-operations-feed";
import { QuickActions } from "@/components/domain/dashboard/quick-actions";
import { ArrivalsTable } from "@/components/domain/dashboard/arrivals-table";
import {
  dashboardStats,
  liveFeed,
  arrivals,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard",
  description: "EventFlow Pro operational dashboard",
};

export default function DashboardPage() {
  const stats = dashboardStats;
  const capacityPct = Math.round(
    (stats.roomOccupied / stats.roomTotal) * 100
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Check-in Progress"
          value={`${stats.checkInPercent}%`}
          trend={stats.checkInTrend}
          icon={UserCheck}
          progress={stats.checkInPercent}
        />
        <StatCard
          label="Pending Pickups"
          value={`${stats.pendingPickups} units`}
          subtext={`${stats.delayedPickups} delayed over 15m`}
          subtextClassName="text-status-warning"
          icon={Car}
        />
        <StatCard
          label="Room Assignments"
          value={`${stats.roomOccupied}/${stats.roomTotal}`}
          subtext={`Capacity: ${capacityPct}% occupied`}
          icon={Bed}
        />
        <StatCard
          label="VIP Alerts"
          value={`${stats.vipAlerts} active`}
          subtext="Immediate action required"
          icon={AlertTriangle}
          accent="error"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveOperationsFeed items={liveFeed} />
        </div>
        <QuickActions />
      </div>
      <ArrivalsTable arrivals={arrivals} />
      <Button
        size="icon"
        className="fixed bottom-8 right-8 size-14 rounded-full shadow-lg"
        type="button"
      >
        <Plus className="size-6" />
      </Button>
    </div>
  );
}
