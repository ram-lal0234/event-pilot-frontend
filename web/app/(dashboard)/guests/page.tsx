import { Download, Filter, Plus } from "lucide-react";
import { PageHeader } from "@/components/domain/page-header";
import { GuestTable } from "@/components/domain/guests/guest-table";
import { guests, guestStats } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Guests",
  description: "Guest management for Global Tech Summit 2024",
};

export default function GuestsPage() {
  return (
    <div>
      <PageHeader
        breadcrumb="EVENTS / GLOBAL TECH SUMMIT 2024"
        title="Guest Management"
        actions={
          <>
            <Button variant="outline" type="button" className="gap-2">
              <Filter className="size-4" />
              Filter
            </Button>
            <Button variant="outline" type="button" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
            <Button type="button" className="gap-2">
              <Plus className="size-4" />
              Add Guest
            </Button>
          </>
        }
      />
      <GuestTable guests={guests} />
      <GuestFooter stats={guestStats} />
    </div>
  );
}

function GuestFooter({
  stats,
}: {
  stats: { total: number; checkedIn: number; pending: number };
}) {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <span>
          Total Guests: <strong>{stats.total.toLocaleString()}</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-success" />
          Checked-in: <strong>{stats.checkedIn}</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-warning" />
          Pending: <strong>{stats.pending}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="icon" type="button">
          <ChevronLeft className="size-4" />
        </Button>
        Page 1 of 5
        <Button variant="ghost" size="icon" type="button">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
