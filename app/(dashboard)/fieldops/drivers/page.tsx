"use client";

import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriversViewPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-semibold">Drivers View</h1>
      <p className="text-sm text-muted-foreground">Quick mobile access to cab allocations and rider assignments.</p>
      <Button className="w-full gap-2" render={<Link href="/operations" />} nativeButton={false}>
        <Car className="size-4" />
        Open Cab Operations
      </Button>
    </main>
  );
}
