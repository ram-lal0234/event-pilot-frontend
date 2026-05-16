import {
  Hotel,
  PersonStanding,
  Printer,
  Car,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const actions = [
  { label: "New Guest", icon: PersonStanding },
  { label: "Dispatch Driver", icon: Car },
  { label: "Assign Room", icon: Hotel },
  { label: "Print QR Badges", icon: Printer },
];

export function QuickActions() {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              type="button"
              className="flex h-auto flex-col items-center gap-2 py-6"
            >
              <action.icon className="size-6 text-primary" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex gap-3 rounded-md border border-amber-200 bg-status-warning-bg p-4">
          <AlertTriangle className="size-5 shrink-0 text-status-warning" />
          <div>
            <p className="text-sm font-semibold text-text-main">System Maintenance</p>
            <p className="text-xs text-muted-foreground">
              Sync issues reported on Badge Printer 04.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
