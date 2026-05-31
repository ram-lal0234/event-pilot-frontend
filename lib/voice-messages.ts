import { ApiError } from "@/lib/api";

export type VoiceCallMode = "ai" | "ivr";

export const voiceCallModeCopy: Record<
  VoiceCallMode,
  {
    button: string;
    menu: string;
    ariaLabel: string;
    successToast: string;
    confirmTitle: string;
    confirmDescription: string;
    confirmButton: string;
    disabledInSettings: string;
  }
> = {
  ai: {
    button: "Call with assistant",
    menu: "Call with assistant",
    ariaLabel: "Call guest with voice assistant",
    successToast: "We're calling this guest now",
    confirmTitle: "Call this guest?",
    confirmDescription:
      "We'll call them now. A voice assistant will ask if they can attend and record their reply.",
    confirmButton: "Start call",
    disabledInSettings: "Assistant calls are turned off for this event",
  },
  ivr: {
    button: "Call with keypad",
    menu: "Call with keypad",
    ariaLabel: "Call guest with keypad options",
    successToast: "We're calling this guest now",
    confirmTitle: "Call this guest?",
    confirmDescription:
      "We'll call them now. They can press 1 to confirm or 2 to decline.",
    confirmButton: "Start call",
    disabledInSettings: "Keypad calls are turned off for this event",
  },
};

export const voiceCallUi = {
  startingCall: "Starting call…",
  savingRsvp: "Saving…",
  pendingGuestOnly: "You can only call guests who haven't responded yet",
  callGuest: "Call guest",
  defaultError: "We couldn't start the call. Please try again.",
};

const VOICE_ERROR_MESSAGES: Record<string, string> = {
  AI_VOICE_NOT_CONFIGURED:
    "Assistant calls aren't set up yet. Please contact your administrator.",
  IVR_VOICE_NOT_CONFIGURED:
    "Keypad calls aren't set up yet. Please contact your administrator.",
  VOICE_AI_CALLS_DISABLED: "Assistant calls are turned off for this event.",
  IVR_CALLS_DISABLED: "Keypad calls are turned off for this event.",
  VOICE_CALL_NOT_ALLOWED_FOR_RSVP_STATUS:
    "This guest has already responded. You can only call guests who haven't replied yet.",
  CALL_IN_PROGRESS:
    "We're already calling this guest. Please wait until the current call finishes.",
  VOICE_NOT_ALLOWED: "Your account can't place calls for this event.",
  GUEST_NOT_FOUND: "We couldn't find this guest.",
  EVENT_NOT_FOUND: "We couldn't find this event.",
};

export function getVoiceCallErrorMessage(
  err: unknown,
  fallback = voiceCallUi.defaultError,
): string {
  if (err instanceof ApiError) {
    if (err.code && VOICE_ERROR_MESSAGES[err.code]) {
      return VOICE_ERROR_MESSAGES[err.code];
    }

    const normalized = err.message.trim().toLowerCase();
    if (normalized.includes("call is already queued") || normalized.includes("call in progress")) {
      return VOICE_ERROR_MESSAGES.CALL_IN_PROGRESS;
    }
    if (normalized.includes("pending rsvp")) {
      return VOICE_ERROR_MESSAGES.VOICE_CALL_NOT_ALLOWED_FOR_RSVP_STATUS;
    }
    if (normalized.includes("ivr calls are disabled")) {
      return VOICE_ERROR_MESSAGES.IVR_CALLS_DISABLED;
    }
    if (normalized.includes("ai voice calls are disabled")) {
      return VOICE_ERROR_MESSAGES.VOICE_AI_CALLS_DISABLED;
    }
    if (normalized.includes("not configured")) {
      return "Calls aren't set up yet. Please contact your administrator.";
    }

    if (err.message.trim()) {
      return err.message;
    }
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  return fallback;
}

export function liveCallStatusLabel(status?: string | null): string {
  const value = (status || "").toUpperCase();
  if (value === "DIALING") return "Connecting…";
  if (value === "RINGING") return "Ringing…";
  if (value === "ANSWERED" || value === "AI_ACTIVE") return "On the call…";
  if (value === "COMPLETED") return "Finished";
  if (value === "FAILED") return "Couldn't connect";
  return "Calling…";
}
