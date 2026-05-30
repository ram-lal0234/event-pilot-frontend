"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import {
  COACH_MARK_STEPS,
  advanceCoachMark,
  dismissCoachMarks,
  pathnameMatchesStep,
  readCoachMarkState,
  type CoachMarkStep,
} from "@/lib/coach-marks";

const CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 180;

function findVisibleTarget(selector: string) {
  const elements = document.querySelectorAll(selector);
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return element;
    }
  }
  return null;
}

function computeCardPosition(targetRect: DOMRect, step: CoachMarkStep) {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const gap = 12;

  if (step.placement === "right") {
    const top = Math.min(
      Math.max(targetRect.top + targetRect.height / 2 - CARD_HEIGHT_ESTIMATE / 2, 16),
      viewportH - CARD_HEIGHT_ESTIMATE - 16,
    );
    const left = Math.min(targetRect.right + gap, viewportW - CARD_WIDTH - 16);
    return { top: `${top}px`, left: `${left}px` };
  }

  const topBelow = targetRect.bottom + gap;
  const topAbove = targetRect.top - CARD_HEIGHT_ESTIMATE - gap;
  const fitsBelow = topBelow + CARD_HEIGHT_ESTIMATE <= viewportH - 16;
  const top = fitsBelow ? topBelow : Math.max(topAbove, 16);

  let left = targetRect.left;
  if (step.placement === "bottom-end") {
    left = targetRect.right - CARD_WIDTH;
  }

  left = Math.min(Math.max(left, 16), viewportW - CARD_WIDTH - 16);

  return { top: `${top}px`, left: `${left}px` };
}

export function PlannerCoachMarks() {
  const pathname = usePathname();
  const { eventsLoaded, events } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const state = readCoachMarkState();
    setDismissed(state.dismissed);
    setStepIndex(state.stepIndex);
  }, []);

  const step = COACH_MARK_STEPS[stepIndex] ?? null;
  const visible = Boolean(
    eventsLoaded
    && events.length > 0
    && !dismissed
    && step
    && pathnameMatchesStep(pathname, step),
  );

  useEffect(() => {
    if (!visible || !step) {
      setTargetRect(null);
      return undefined;
    }

    let cancelled = false;
    let interval: number | undefined;
    let timeout: number | undefined;

    const update = () => {
      if (cancelled) return false;

      const element = findVisibleTarget(step.target);
      if (!element) {
        setTargetRect(null);
        return false;
      }

      element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      setTargetRect(element.getBoundingClientRect());
      return true;
    };

    const bind = () => {
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
    };

    const unbind = () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };

    if (!update()) {
      interval = window.setInterval(() => {
        if (update()) {
          window.clearInterval(interval);
          interval = undefined;
          bind();
        }
      }, 150);

      timeout = window.setTimeout(() => {
        if (interval !== undefined) {
          window.clearInterval(interval);
          interval = undefined;
        }
      }, 8000);
    } else {
      bind();
    }

    return () => {
      cancelled = true;
      if (interval !== undefined) window.clearInterval(interval);
      if (timeout !== undefined) window.clearTimeout(timeout);
      unbind();
    };
  }, [step, visible, pathname]);

  const cardStyle = useMemo(() => {
    if (!targetRect || !step) return undefined;
    return computeCardPosition(targetRect, step);
  }, [step, targetRect]);

  if (!visible || !step || !targetRect || !cardStyle) {
    return null;
  }

  return (
    <>
      <div
        className="pointer-events-none fixed z-[70] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      <div
        className="fixed z-[71] w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-4 shadow-lg"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Step {stepIndex + 1} of {COACH_MARK_STEPS.length}
            </p>
            <h3 className="mt-1 font-semibold text-foreground">{step.title}</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss tour"
            onClick={() => {
              dismissCoachMarks();
              setDismissed(true);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              dismissCoachMarks();
              setDismissed(true);
            }}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const next = advanceCoachMark(stepIndex);
              if (next >= COACH_MARK_STEPS.length) {
                setDismissed(true);
              } else {
                setStepIndex(next);
              }
            }}
          >
            {stepIndex + 1 >= COACH_MARK_STEPS.length ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </>
  );
}
