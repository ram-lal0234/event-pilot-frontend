import { Plus } from "lucide-react";
import type { Cab } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusColors = {
  active: "bg-primary",
  delayed: "bg-status-warning",
  idle: "bg-muted-foreground",
};

export function CabGrid({ cabs }: { cabs: Cab[] }) {
  const online = cabs.filter((c) => c.status !== "idle").length;

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Active Cabs & Logistics
        </CardTitle>
        <Badge className="bg-status-success-bg text-status-success hover:bg-status-success-bg">
          {online} VEHICLES ONLINE
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cabs.map((cab) => (
            <CabCard key={cab.id} cab={cab} />
          ))}
          <Button
            variant="outline"
            type="button"
            className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 border-dashed"
          >
            <Plus className="size-6 text-primary" />
            <span className="text-sm font-medium">Assign New Driver</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CabCard({ cab }: { cab: Cab }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="p-4">
        <CabHeader cab={cab} />
        <p className="mt-2 text-sm font-medium">{cab.driver}</p>
      </div>
      <div
        className={cn(
          "px-4 py-2 text-xs font-medium text-white",
          statusColors[cab.status]
        )}
      >
        {cab.statusLabel}
      </div>
    </div>
  );
}

function CabHeader({ cab }: { cab: Cab }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-bold text-text-main">{cab.label}</p>
        <p className="text-sm text-muted-foreground">{cab.model}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {cab.assigned}/{cab.capacity}
      </p>
    </div>
  );
}
