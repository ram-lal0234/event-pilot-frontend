"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { loginTheme } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const IMAGE = {
  src: "/login-svg.png",
  width: 1080,
  height: 1080,
  alt: "EventPilot AI dashboard on a laptop",
} as const;

const MAX_ROTATE_Y = 12;
const MAX_ROTATE_X = 4;
const MAX_SHIFT_X = 10;

type Tilt = { rotateY: number; rotateX: number; translateX: number };

const REST_TILT: Tilt = { rotateY: -10, rotateX: 3, translateX: 0 };

function tiltTransform({ rotateY, rotateX, translateX }: Tilt) {
  return `perspective(1200px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateX(${translateX}px)`;
}

/** Laptop asset anchored to the bottom of the hero panel; subtle cursor tilt. */
export function LoginHeroMockup({ className }: { className?: string }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<Tilt>(REST_TILT);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const updateTilt = useCallback(
    (clientX: number, clientY: number) => {
      const zone = zoneRef.current;
      if (!zone || reduceMotion) return;

      const rect = zone.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
      const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));

      setTilt({
        rotateY: REST_TILT.rotateY + nx * MAX_ROTATE_Y,
        rotateX: REST_TILT.rotateX - ny * MAX_ROTATE_X,
        translateX: nx * MAX_SHIFT_X,
      });
    },
    [reduceMotion],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovering(true);
      updateTilt(e.clientX, e.clientY);
    },
    [updateTilt],
  );

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt(REST_TILT);
  }, []);

  const activeTilt = reduceMotion ? REST_TILT : tilt;
  const tiltTransition =
    isHovering && !reduceMotion ? "transform 0.12s ease-out" : "transform 0.5s ease-out";

  return (
    <div
      ref={zoneRef}
      className={cn("relative min-h-0 w-full flex-1", className)}
      style={{ perspective: "1200px" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[12%] left-1/2 h-24 w-[75%] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: loginTheme.goldGradient, opacity: 0.25 }}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className="relative w-[112%] max-w-[440px] will-change-transform"
          style={{
            transform: tiltTransform(activeTilt),
            transition: tiltTransition,
          }}
        >
          <Image
            src={IMAGE.src}
            alt={IMAGE.alt}
            width={IMAGE.width}
            height={IMAGE.height}
            priority
            draggable={false}
            className="h-auto w-full select-none mix-blend-lighten"
            sizes="(max-width: 768px) 0px, 440px"
          />
        </div>
      </div>
    </div>
  );
}
