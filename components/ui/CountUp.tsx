"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

export default function CountUp({
  value,
  suffix = "",
  decimals = 0,
  duration = 1.8,
  className,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();

  const format = (v: number) =>
    v.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduced) {
      el.textContent = format(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      {format(0)}
    </span>
  );
}
