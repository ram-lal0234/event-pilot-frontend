"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { defaultWorkspaceName, displayNameFromEmail } from "@/lib/onboarding";
import { isAccountOwner } from "@/lib/event-access";
import { BlockingDialog } from "@/components/onboarding/blocking-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PlannerProfileDialogProps = {
  open: boolean;
};

export function PlannerProfileDialog({ open }: PlannerProfileDialogProps) {
  const { user, account, membership, completeOnboarding } = useApp();
  const isOwner = isAccountOwner(membership?.role ?? user.accountRole);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(membership?.name?.trim() || displayNameFromEmail(user.email));
    setPhone(membership?.phone?.trim() || "");
    setWorkspaceName(account?.name || defaultWorkspaceName(user.email));
  }, [account?.name, membership?.name, membership?.phone, open, user.email]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        phone: phone.trim(),
        workspaceName: isOwner ? workspaceName.trim() : undefined,
      });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BlockingDialog
      open={open}
      title="Complete your planner profile"
      description="Required before you can use EventPilot. This dialog stays open until your details are saved."
    >
      <form className="space-y-4" onSubmit={(e) => void submit(e)}>
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
        </Field>
        <Field label="WhatsApp / phone">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
            minLength={8}
            maxLength={30}
          />
        </Field>
        {isOwner ? (
          <Field label="Organisation name" hint="Your planning business or team name.">
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
            />
          </Field>
        ) : null}
        <div className="pt-2">
          <Button className="w-full" type="submit" loading={busy} loadingText="Saving…">
            Save and continue
          </Button>
        </div>
      </form>
    </BlockingDialog>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
