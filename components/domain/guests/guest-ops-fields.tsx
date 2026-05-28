"use client";

import type { GuestRecord } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
      <Select
        value={form.followUpStatus}
        onChange={(event) => onChange({ ...form, followUpStatus: event.target.value as GuestOpsFormState["followUpStatus"] })}
      >
        <option value="NONE">No follow-up</option>
        <option value="NEEDS_FOLLOW_UP">Needs follow-up</option>
        <option value="CALLBACK_LATER">Callback later</option>
        <option value="NO_ANSWER">No answer</option>
        <option value="VOICEMAIL">Voicemail</option>
        <option value="COMPLETED">Completed</option>
      </Select>
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
        <Select value={form.needsCab} onChange={(event) => onChange({ ...form, needsCab: event.target.value as GuestOpsFormState["needsCab"] })}>
          <option value="">Needs cab?</option>
          <option value="true">Needs cab</option>
          <option value="false">No cab</option>
        </Select>
        <Select value={form.needsHotel} onChange={(event) => onChange({ ...form, needsHotel: event.target.value as GuestOpsFormState["needsHotel"] })}>
          <option value="">Needs hotel?</option>
          <option value="true">Needs hotel</option>
          <option value="false">No hotel</option>
        </Select>
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
