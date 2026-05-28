"use client";

import type { GuestRecord } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { OptionDropdown } from "@/components/ui/option-dropdown";
import { Textarea } from "@/components/ui/textarea";

export type GuestOpsFormState = {
  followUpStatus: NonNullable<GuestRecord["followUpStatus"]>;
  callbackAt: string;
  assignedTo: string;
  needsCab: "" | "true" | "false";
  needsHotel: "" | "true" | "false";
  guestNotes: string;
  language: string;
};

export const emptyGuestOpsForm = (): GuestOpsFormState => ({
  followUpStatus: "NONE",
  callbackAt: "",
  assignedTo: "",
  needsCab: "",
  needsHotel: "",
  guestNotes: "",
  language: "",
});

export function guestToOpsFormState(guest: GuestRecord): GuestOpsFormState {
  return {
    followUpStatus: guest.followUpStatus || "NONE",
    callbackAt: guest.callbackAt ? guest.callbackAt.slice(0, 16) : "",
    assignedTo: guest.assignedTo || "",
    needsCab: guest.needsCab === true ? "true" : guest.needsCab === false ? "false" : "",
    needsHotel: guest.needsHotel === true ? "true" : guest.needsHotel === false ? "false" : "",
    guestNotes: guest.guestNotes || "",
    language: guest.language || "",
  };
}

export function buildGuestOpsPayload(form: GuestOpsFormState) {
  return {
    followUpStatus: form.followUpStatus,
    callbackAt: form.callbackAt ? new Date(form.callbackAt).toISOString() : null,
    assignedTo: form.assignedTo || null,
    needsCab: form.needsCab === "" ? null : form.needsCab === "true",
    needsHotel: form.needsHotel === "" ? null : form.needsHotel === "true",
    guestNotes: form.guestNotes || null,
    language: form.language || null,
  };
}

export function GuestOpsFields({
  form,
  onChange,
}: {
  form: GuestOpsFormState;
  onChange: (form: GuestOpsFormState) => void;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">Follow-up & logistics</p>
      <OptionDropdown
        value={form.followUpStatus}
        onValueChange={(followUpStatus) =>
          onChange({ ...form, followUpStatus: followUpStatus as GuestOpsFormState["followUpStatus"] })
        }
        options={[
          { value: "NONE", label: "No follow-up" },
          { value: "NEEDS_FOLLOW_UP", label: "Needs follow-up" },
          { value: "CALLBACK_LATER", label: "Callback later" },
          { value: "NO_ANSWER", label: "No answer" },
          { value: "VOICEMAIL", label: "Voicemail" },
          { value: "COMPLETED", label: "Completed" },
        ]}
        placeholder="Follow-up status"
      />
      <Input
        type="datetime-local"
        value={form.callbackAt}
        onChange={(event) => onChange({ ...form, callbackAt: event.target.value })}
        placeholder="Callback at"
      />
      <Input
        value={form.assignedTo}
        onChange={(event) => onChange({ ...form, assignedTo: event.target.value })}
        placeholder="Assigned to"
      />
      <div className="grid grid-cols-2 gap-2">
        <OptionDropdown
          value={form.needsCab}
          onValueChange={(needsCab) => onChange({ ...form, needsCab: needsCab as GuestOpsFormState["needsCab"] })}
          options={[
            { value: "", label: "Needs cab?" },
            { value: "true", label: "Needs cab" },
            { value: "false", label: "No cab" },
          ]}
        />
        <OptionDropdown
          value={form.needsHotel}
          onValueChange={(needsHotel) =>
            onChange({ ...form, needsHotel: needsHotel as GuestOpsFormState["needsHotel"] })
          }
          options={[
            { value: "", label: "Needs hotel?" },
            { value: "true", label: "Needs hotel" },
            { value: "false", label: "No hotel" },
          ]}
        />
      </div>
      <Input
        value={form.language}
        onChange={(event) => onChange({ ...form, language: event.target.value })}
        placeholder="Preferred language"
      />
      <Textarea
        value={form.guestNotes}
        onChange={(event) => onChange({ ...form, guestNotes: event.target.value })}
        placeholder="Guest notes"
        rows={3}
      />
    </div>
  );
}
