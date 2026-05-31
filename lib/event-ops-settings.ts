import type { EventRecord, EventSettingRecord } from "@/lib/api";

export function resolveEventSettings(
  event: EventRecord | null | undefined,
): EventSettingRecord {
  return {
    voiceAiEnabled: event?.setting?.voiceAiEnabled ?? true,
    ivrEnabled: event?.setting?.ivrEnabled ?? true,
    qrEnabled: event?.setting?.qrEnabled ?? true,
    outreachEnabled: event?.setting?.outreachEnabled ?? false,
    outreachAutoStart: event?.setting?.outreachAutoStart ?? false,
    outreachVoiceDelayHours: event?.setting?.outreachVoiceDelayHours ?? 24,
    outreachAutoCallMode: event?.setting?.outreachAutoCallMode === "ivr" ? "ivr" : "ai",
    outreachReminderEnabled: event?.setting?.outreachReminderEnabled !== false,
    outreachMessageTemplate: event?.setting?.outreachMessageTemplate ?? null,
    outreachReminderTemplate: event?.setting?.outreachReminderTemplate ?? null,
  };
}

export function isAiVoiceEnabled(event: EventRecord | null | undefined): boolean {
  return resolveEventSettings(event).voiceAiEnabled;
}

export function isIvrEnabled(event: EventRecord | null | undefined): boolean {
  return resolveEventSettings(event).ivrEnabled;
}

export function isQrCheckinEnabled(event: EventRecord | null | undefined): boolean {
  return resolveEventSettings(event).qrEnabled;
}

export function isOutreachEnabled(event: EventRecord | null | undefined): boolean {
  return resolveEventSettings(event).outreachEnabled === true;
}

/** Outreach on with no AI or IVR — automation sends WhatsApp only, no auto-calls. */
export function isOutreachWhatsAppOnly(
  outreachEnabled: boolean,
  voiceAiEnabled: boolean,
  ivrEnabled: boolean,
): boolean {
  return outreachEnabled && !voiceAiEnabled && !ivrEnabled;
}
