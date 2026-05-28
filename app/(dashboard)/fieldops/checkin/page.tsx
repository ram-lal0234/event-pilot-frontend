"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FieldOpsCheckinPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-semibold">FieldOps Check-in</h1>
      <p className="text-sm text-muted-foreground">Simplified mobile check-in experience for gate and desk staff.</p>
      <Button className="w-full gap-2" render={<Link href="/check-in" />} nativeButton={false}>
        <QrCode className="size-4" />
        Open Check-in Console
      </Button>
    </main>
  );
}
