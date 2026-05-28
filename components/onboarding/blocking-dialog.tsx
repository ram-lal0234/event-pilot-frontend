"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BlockingDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
};

/** Modal that cannot be dismissed until the flow inside is completed. */
export function BlockingDialog({ open, title, description, children }: BlockingDialogProps) {
  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(next) => {
        if (!next) return;
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader className="pr-0">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
