"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { GuestRecord } from "@/lib/api";
import { guestToFormState, type GuestFormState } from "@/lib/guest-form";
import { GuestFormFields } from "@/components/domain/guests/guest-form-fields";
import {
  GuestOpsFields,
  buildGuestOpsPayload,
  guestToOpsFormState,
  type GuestOpsFormState,
} from "@/components/domain/guests/guest-ops-fields";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
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
  stacked = false,
}: {
  guest: GuestRecord;
  onSave: (guestId: string, form: GuestFormState, ops: GuestOpsFormState) => Promise<string | null>;
  compact?: boolean;
  stacked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => guestToFormState(guest));
  const [opsForm, setOpsForm] = useState(() => guestToOpsFormState(guest));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(guestToFormState(guest));
      setOpsForm(guestToOpsFormState(guest));
    }
  }, [open, guest]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const errorMessage = await onSave(guest.id, form, opsForm);
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
    <Button
      variant="outline"
      size="sm"
      className={stacked ? "w-full justify-center gap-2" : "gap-2"}
      type="button"
    >
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
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Edit guest</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-0">
            <GuestFormFields form={form} onChange={setForm} />
            <GuestOpsFields form={opsForm} onChange={setOpsForm} />
          </SheetBody>
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
