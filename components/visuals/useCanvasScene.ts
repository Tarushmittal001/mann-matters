"use client";

import { useEffect, useRef } from "react";

/**
 * The shared machinery behind every canvas piece on the site.
 *
 * `NeuralBrain` grew all of this inline — hi-dpi sizing, a ResizeObserver, the
 * rAF loop, pointer tracking, reduced-motion handling. Rather than copy those
 * eighty lines into each new visual, they live here once and each scene becomes
 * just its drawing logic.
 *
 * Reduced motion is passed *through* to the scene rather than stopping the
 * loop: that preference is about vestibular safety, so a scene should go still
 * while still answering hover and click. Each scene decides what "still" means
 * for it.
 */

export type SceneFrame = {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels — the transform is already scaled for device pixel ratio. */
  w: number;
  h: number;
  /** Seconds since the scene started. */
  t: number;
  /** Seconds since the previous frame, clamped so a backgrounded tab can't jump. */
  dt: number;
  pointer: { x: number; y: number; active: boolean };
  reduced: boolean;
};

export type SceneHandlers = {
  /** Called once at start and again whenever the canvas is resized. */
  setup?: (env: { w: number; h: number; reduced: boolean }) => void;
  draw: (frame: SceneFrame) => void;
  /** Canvas-space coordinates. */
  onPointerDown?: (x: number, y: number) => void;
};

export function useCanvasScene(handlers: SceneHandlers) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // held in a ref so a scene can close over fresh state without re-running the effect
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;

    const pointer = { x: -9999, y: -9999, active: false };
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      handlersRef.current.setup?.({ w, h, reduced });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onMotionChange = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      handlersRef.current.setup?.({ w, h, reduced });
    };
    media.addEventListener("change", onMotionChange);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // a tap never sends a hover first, so seed the pointer from the tap
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      handlersRef.current.onPointerDown?.(x, y);
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerdown", onDown);

    const start = performance.now();
    let prev = start;
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      handlersRef.current.draw({ ctx, w, h, t, dt, pointer, reduced });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      media.removeEventListener("change", onMotionChange);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return { wrapRef, canvasRef };
}

/* Brand colours, so the scenes agree with tailwind.config.ts without importing it. */
export const PALETTE = {
  forest: [14, 59, 51] as const,
  forestDeep: [10, 46, 40] as const,
  sage: [168, 195, 181] as const,
  gold: [200, 164, 93] as const,
  ink: [31, 45, 40] as const,
};

export const rgba = (c: readonly [number, number, number], a: number) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

export const mix = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
