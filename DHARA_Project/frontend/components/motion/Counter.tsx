"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * Animates a numeric count-up when scrolled into view. Accepts display strings like
 * "15+", "300+", "1,240" and animates the numeric portion while preserving prefix/suffix
 * (commas, "+", etc.) — see FR-HOM-003.
 */
export default function Counter({
  value,
  duration = 1.6,
  className,
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const shouldReduceMotion = useReducedMotion();

  const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);
  const prefix = match?.[1] ?? "";
  const numeric = match ? parseInt(match[2].replace(/,/g, ""), 10) : NaN;
  const suffix = match?.[3] ?? "";

  useEffect(() => {
    const el = ref.current;
    if (!el || Number.isNaN(numeric)) return;

    if (!isInView) return;

    if (shouldReduceMotion) {
      el.textContent = `${prefix}${numeric.toLocaleString()}${suffix}`;
      return;
    }

    const controls = animate(0, numeric, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        el.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [isInView, numeric, prefix, suffix, duration, shouldReduceMotion]);

  if (Number.isNaN(numeric)) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
