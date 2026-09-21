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
 *
 * Two things keep this cheap, which matters on a mid-range Android:
 *   - the loop only runs while the canvas is on screen and the tab is visible;
 *   - `quality` tells a scene how much it can afford (see `sceneQuality`), so a
 *     phone draws fewer of everything instead of the same scene slowly.
 */

/** How much a scene can afford to draw on this device. */
export type SceneQuality = {
  /** 1 on a capable desktop, 0.55 on a small or low-power device. */
  detail: number;
  /** Frames per second the loop aims for; a phone gets 30 rather than 60. */
  fps: number;
  /** True on phones and low-core devices. */
  lite: boolean;
};

/**
 * Judged once, from screen size and the hardware the browser admits to.
 * Deliberately blunt: it decides how many particles to draw, not correctness.
 */
export function sceneQuality(): SceneQuality {
  if (typeof window === "undefined") return { detail: 1, fps: 60, lite: false };
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const lite = narrow || (coarse && fewCores) || saveData;
  return lite ? { detail: 0.55, fps: 30, lite: true } : { detail: 1, fps: 60, lite: false };
}

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
  quality: SceneQuality;
};

export type SceneHandlers = {
  /** Called once at start and again whenever the canvas is resized. */
  setup?: (env: { w: number; h: number; reduced: boolean; quality: SceneQuality }) => void;
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
    const quality = sceneQuality();
    // a phone paints far more pixels per particle; 1.5x is the honest ceiling there
    const maxDpr = quality.lite ? 1.5 : 2;
    const frameGap = 1000 / quality.fps;

    const pointer = { x: -9999, y: -9999, active: false };
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      handlersRef.current.setup?.({ w, h, reduced, quality });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onMotionChange = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      handlersRef.current.setup?.({ w, h, reduced, quality });
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
    let last = 0;
    let raf = 0;
    let running = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // hold the scene to its target frame rate: 30fps on a phone is half the work
      if (now - last < frameGap - 1) return;
      last = now;

      const t = (now - start) / 1000;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      handlersRef.current.draw({ ctx, w, h, t, dt, pointer, reduced, quality });
    };

    const play = () => {
      if (running) return;
      running = true;
      // the clock jumps while paused; don't hand the scene a huge dt
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    // off screen or in a background tab, a canvas has no reason to draw
    let onScreen = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !document.hidden) play();
        else pause();
      },
      { rootMargin: "200px" }
    );
    io.observe(wrap);

    const onVisibility = () => {
      if (!document.hidden && onScreen) play();
      else pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    play();

    return () => {
      pause();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
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
