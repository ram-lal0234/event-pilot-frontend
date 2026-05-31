const STORAGE_KEY = "eventpilot:planner-coachmarks";

export type CoachMarkStepId = "import" | "call" | "checkin";

export type CoachMarkStep = {
  id: CoachMarkStepId;
  title: string;
  body: string;
  target: string;
  pathIncludes: string[];
  placement: "bottom-start" | "bottom-end" | "right";
};

export const COACH_MARK_STEPS: CoachMarkStep[] = [
  {
    id: "import",
    title: "Import or add guests",
    body: "Upload a CSV or create guests one by one. Each guest gets a QR code and RSVP link.",
    target: '[data-coach="guest-import"]',
    pathIncludes: ["/guests"],
    placement: "bottom-end",
  },
  {
    id: "call",
    title: "Call guests for RSVP",
    body: "Use Call all pending or call a guest from their row. Choose assistant calls or keypad calls (press 1 or 2).",
    target: '[data-coach="guest-call"]',
    pathIncludes: ["/guests"],
    placement: "bottom-end",
  },
  {
    id: "checkin",
    title: "Check in on arrival",
    body: "Open Check-In to scan guest QR codes at the gate or hotel desk.",
    target: '[data-coach="nav-check-in"]',
    pathIncludes: [],
    placement: "right",
  },
];

export type CoachMarkState = {
  dismissed: boolean;
  stepIndex: number;
};

export function readCoachMarkState(): CoachMarkState {
  if (typeof window === "undefined") {
    return { dismissed: false, stepIndex: 0 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: false, stepIndex: 0 };
    const parsed = JSON.parse(raw) as CoachMarkState;
    return {
      dismissed: Boolean(parsed.dismissed),
      stepIndex: Number.isFinite(parsed.stepIndex) ? parsed.stepIndex : 0,
    };
  } catch {
    return { dismissed: false, stepIndex: 0 };
  }
}

export function writeCoachMarkState(state: CoachMarkState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function dismissCoachMarks() {
  writeCoachMarkState({ dismissed: true, stepIndex: COACH_MARK_STEPS.length });
}

export function advanceCoachMark(stepIndex: number) {
  const next = stepIndex + 1;
  if (next >= COACH_MARK_STEPS.length) {
    dismissCoachMarks();
    return COACH_MARK_STEPS.length;
  }
  writeCoachMarkState({ dismissed: false, stepIndex: next });
  return next;
}

export function pathnameMatchesStep(pathname: string, step: CoachMarkStep) {
  if (!step.pathIncludes.length) return true;
  return step.pathIncludes.some((segment) => pathname.includes(segment));
}
