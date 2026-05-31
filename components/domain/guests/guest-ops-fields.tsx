"use client";

import type { GuestRecord } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        onValueChange={(followUpStatus) => {
          if (followUpStatus != null) {
            onChange({
              ...form,
              followUpStatus: followUpStatus as GuestOpsFormState["followUpStatus"],
            });
          }
        }}
      >
        <SelectTrigger className="w-full justify-between font-normal">
          <SelectValue placeholder="Follow-up status" />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="NONE">No follow-up</SelectItem>
          <SelectItem value="NEEDS_FOLLOW_UP">Needs follow-up</SelectItem>
          <SelectItem value="CALLBACK_LATER">Callback later</SelectItem>
          <SelectItem value="NO_ANSWER">No answer</SelectItem>
          <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
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
        <Select
          value={form.needsCab}
          onValueChange={(needsCab) => {
            if (needsCab != null) {
              onChange({ ...form, needsCab: needsCab as GuestOpsFormState["needsCab"] });
            }
          }}
        >
          <SelectTrigger className="w-full justify-between font-normal">
            <SelectValue placeholder="Needs cab?" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="">Needs cab?</SelectItem>
            <SelectItem value="true">Needs cab</SelectItem>
            <SelectItem value="false">No cab</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={form.needsHotel}
          onValueChange={(needsHotel) => {
            if (needsHotel != null) {
              onChange({ ...form, needsHotel: needsHotel as GuestOpsFormState["needsHotel"] });
            }
          }}
        >
          <SelectTrigger className="w-full justify-between font-normal">
            <SelectValue placeholder="Needs hotel?" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="">Needs hotel?</SelectItem>
            <SelectItem value="true">Needs hotel</SelectItem>
            <SelectItem value="false">No hotel</SelectItem>
          </SelectContent>
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
