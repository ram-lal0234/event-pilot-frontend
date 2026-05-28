"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { GuestRecord } from "@/lib/api";
import { guestToFormState, type GuestFormState } from "@/lib/guest-form";
import { GuestFormFields } from "@/components/domain/guests/guest-form-fields";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function GuestEditSheet({
  guest,
  onSave,
  compact = false,
}: {
  guest: GuestRecord;
  onSave: (guestId: string, form: GuestFormState) => Promise<string | null>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => guestToFormState(guest));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(guestToFormState(guest));
    }
  }, [open, guest]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const errorMessage = await onSave(guest.id, form);
    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.success("Guest updated");
      setOpen(false);
    }
    setBusy(false);
  };

  const trigger: ReactNode = compact ? (
    <Button
      variant="ghost"
      size="icon-sm"
      type="button"
      aria-label={`Edit ${guest.name}`}
    >
      <Pencil className="size-4" />
    </Button>
  ) : (
    <Button variant="outline" size="sm" className="gap-2" type="button">
      <Pencil className="size-4" />
      Edit guest
    </Button>
  );

  const sheetTrigger = <SheetTrigger render={trigger} />;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {compact ? (
        <Tooltip>
          <TooltipTrigger render={sheetTrigger} />
          <TooltipContent>Edit guest</TooltipContent>
        </Tooltip>
      ) : (
        sheetTrigger
      )}
      <SheetContent className="sm:max-w-md">
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Edit guest</SheetTitle>
          </SheetHeader>
          <div className="px-4">
            <GuestFormFields form={form} onChange={setForm} />
          </div>
          <SheetFooter>
            <Button type="submit" loading={busy} loadingText="Saving guest">
              Save changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
