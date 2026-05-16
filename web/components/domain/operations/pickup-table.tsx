import { CheckCircle2, Plane, Train, XCircle } from "lucide-react";
import type { Pickup } from "@/types";
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

const arrivalIcons = {
  flight: Plane,
  train: Train,
  jet: Plane,
};

export function PickupTable({ pickups }: { pickups: Pickup[] }) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Upcoming Pickups</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" type="button">
            Filter Arrivals
          </Button>
          <Button variant="outline" size="sm" type="button">
            Export Manifest
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest Name</TableHead>
              <TableHead>Arrival Info</TableHead>
              <TableHead>Scheduled Time</TableHead>
              <TableHead>Driver Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pickups.map((pickup) => {
              const Icon = arrivalIcons[pickup.arrivalIcon];
              return (
                <TableRow key={pickup.id}>
                  <TableCell className="font-medium">{pickup.guestName}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="size-4" />
                      {pickup.arrivalInfo}
                    </span>
                  </TableCell>
                  <TableCell
                    className={pickup.timeHighlight ? "font-semibold text-status-error" : ""}
                  >
                    {pickup.scheduledTime}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-sm">
                      {pickup.driverStatus === "assigned" ? (
                        <CheckCircle2 className="size-4 text-status-success" />
                      ) : (
                        <XCircle className="size-4 text-status-error" />
                      )}
                      {pickup.driverLabel}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {pickup.driverStatus === "unassigned" && (
                      <Button variant="link" type="button" className="h-auto p-0">
                        Assign Driver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="p-4 text-center text-sm text-primary">Show more arrivals...</p>
      </CardContent>
    </Card>
  );
}
