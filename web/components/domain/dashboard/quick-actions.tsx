import {
  AlertTriangle,
  Hotel,
  PersonStanding,
  Printer,
  Car,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "New Guest", icon: PersonStanding, href: "/guests" },
  { label: "Dispatch Driver", icon: Car, href: "/operations" },
  { label: "Assign Room", icon: Hotel, href: "/operations" },
  { label: "Print QR Badges", icon: Printer, href: "/check-in" },
];

export function QuickActions() {
  return (
    <Card className="h-fit gap-0 rounded-lg border border-border py-0 shadow-none">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              render={<Link href={action.href} />}
              nativeButton={false}
              variant="outline"
              className="h-24 flex-col items-center justify-center gap-2 rounded-md bg-muted/40 px-2 py-4 text-center hover:bg-muted"
            >
              <action.icon className="size-6 text-primary" />
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex gap-3 rounded-md border border-amber-300 bg-status-warning-bg p-3">
          <AlertTriangle className="size-5 shrink-0 text-status-warning" />
          <div className="min-w-0">
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
