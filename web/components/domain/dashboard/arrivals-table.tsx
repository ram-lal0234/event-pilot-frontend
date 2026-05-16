import Link from "next/link";
import type { Arrival } from "@/types";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ArrivalsTable({ arrivals }: { arrivals: Arrival[] }) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Incoming Arrivals
        </CardTitle>
        <Link href="#" className="text-sm font-medium text-primary hover:underline">
          View Schedule &gt;
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Flight/Source</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {arrivals.map((arrival) => (
              <TableRow key={arrival.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {arrival.guestInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {arrival.guestName}
                      {arrival.isVip && (
                        <span className="ml-1 text-xs text-primary">VIP</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{arrival.source}</TableCell>
                <TableCell
                  className={
                    arrival.etaHighlight ? "font-semibold text-status-error" : ""
                  }
                >
                  {arrival.eta}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    variant={
                      arrival.status === "on-time"
                        ? "success"
                        : arrival.status === "delayed"
                          ? "error"
                          : "success"
                    }
                  >
                    {arrival.statusLabel}
                  </StatusBadge>
                </TableCell>
                <TableCell>{arrival.pickup}</TableCell>
                <TableCell className="text-right">
                  {arrival.status === "delayed" && (
                    <Button size="sm" type="button">
                      Assign
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
