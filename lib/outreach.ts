export type OutreachStatus =
  | "IDLE"
  | "WHATSAPP_INITIAL_SENT"
  | "AWAITING_RSVP"
  | "VOICE_SCHEDULED"
  | "VOICE_ATTEMPTED"
  | "WHATSAPP_REMINDER_SENT"
  | "COMPLETE"
  | "PAUSED"
  | "NEEDS_PLANNER";

export type OutreachNextStep = {
  id: string;
  title: string;
  description: string;
  action:
    | "open_event_settings"
    | "start_outreach_batch"
    | "open_follow_up"
    | "monitor"
    | "none";
  status: "todo" | "in_progress" | "done";
};

export type OutreachSummary = {
  enabled: boolean;
  autoStart: boolean;
  voiceDelayHours: number;
  autoCallMode: "ai" | "ivr";
  reminderEnabled: boolean;
  whatsappSenderUrl: string;
  counts: {
    idle: number;
    awaiting: number;
    voiceAttempted: number;
    reminderSent: number;
    needsPlanner: number;
    complete: number;
    paused: number;
  };
  pendingRsvp: number;
  nextSteps: OutreachNextStep[];
};

export const outreachStatusLabels: Record<OutreachStatus, string> = {
  IDLE: "Not started",
  WHATSAPP_INITIAL_SENT: "WhatsApp sent",
  AWAITING_RSVP: "Awaiting RSVP",
  VOICE_SCHEDULED: "Call scheduled",
  VOICE_ATTEMPTED: "Call placed",
  WHATSAPP_REMINDER_SENT: "Reminder sent",
  COMPLETE: "Complete",
  PAUSED: "Paused",
  NEEDS_PLANNER: "Needs follow-up",
};

export function outreachStatusVariant(
  status: OutreachStatus | undefined,
): "neutral" | "success" | "warning" | "error" {
  switch (status) {
    case "COMPLETE":
      return "success";
    case "NEEDS_PLANNER":
    case "PAUSED":
      return "error";
    case "IDLE":
      return "neutral";
    default:
      return "warning";
  }
}
