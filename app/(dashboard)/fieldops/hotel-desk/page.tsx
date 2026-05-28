"use client";

import Link from "next/link";
import { Bed } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HotelDeskPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-semibold">Hotel Desk View</h1>
      <p className="text-sm text-muted-foreground">Quick access to room assignment operations for hotel staff.</p>
      <Button className="w-full gap-2" render={<Link href="/operations" />} nativeButton={false}>
        <Bed className="size-4" />
        Open Operations
      </Button>
    </main>
  );
}
