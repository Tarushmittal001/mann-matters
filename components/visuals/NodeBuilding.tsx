"use client";

import { useRef } from "react";

import { pillars } from "@/lib/organisations";
import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * A stack of cantilevered volumes, drawn as a node frame.
 *
 * Each storey is a box shoved out over the one below it in a different
 * direction, so the tower reads as built rather than extruded — corners are
 * nodes, edges are beams, and the front face carries a grid of window nodes
 * that light up.
 *
 * One volume per entry in `pillars` — the six parts a program is assembled from
 * — so the tower *is* the offer, and adding a part adds a storey on its own.
 * A cantilever is the right figure for this page: every floor is carried by
 * what is underneath it, and each one reaches somewhere the last did not.
 *
 * **Click any volume.** Its windows light in sequence, then the light carries
 * outward to the storeys above and below, one at a time, up and down the stack.
 *
 * Colour runs warm to cool up the tower — amber-gold at street level through
 * lime to deep forest at the roof — which is both the reference's gradient and
 * the site's own palette, so no colour here is foreign to the brand.
 *
 * Drawn in axonometric projection: `project()` maps (x, height, depth) onto the
 * canvas, so the volumes have real tops and sides instead of being flat rects.
 */

type RGB = readonly [number, number, number];

const BASE_C: RGB = [214, 158, 66]; // amber-gold, street level
const MID_C: RGB = [166, 186, 74]; // lime
const TOP_C: RGB = [32, 104, 74]; // deep forest, roof

function storeyColour(p: number): RGB {
  return p < 0.5 ? mix(BASE_C, MID_C, p * 2) : mix(MID_C, TOP_C, (p - 0.5) * 2);
}

const COUNT = Math.max(4, pillars.length);
const WIN_COLS = 6;
const WIN_ROWS = 2;

/** Depth direction on screen: how far one unit of depth moves right, and up. */
const DX = 0.46;
const DY = -0.3;

type Win = { lit: number; delay: number };
type Box = {
  /** Cantilever: how far this volume is shoved off the tower's axis. */
  offX: number;
  offZ: number;
  w: number;
  d: number;
  rgb: RGB;
  glow: number;
  /** Seconds since this storey was told to light; drives the window sequence. */
  since: number;
  wins: Win[];
};

export default function NodeBuilding({ className = "" }: { className?: string }) {
  const S = useRef({
    boxes: Array.from({ length: COUNT }, (_, i): Box => ({
      // deterministic but irregular — a stack, not a staircase
      offX: Math.sin(i * 2.27) * 0.42 + Math.sin(i * 0.9) * 0.16,
      offZ: Math.cos(i * 1.73) * 0.3,
      w: 0.84 + Math.sin(i * 1.4) * 0.13,
      d: 0.5,
      rgb: storeyColour(i / (COUNT - 1)),
      glow: i === 0 ? 0.35 : 0.12,
      since: 99,
      wins: Array.from({ length: WIN_COLS * WIN_ROWS }, (_, k) => ({
        lit: 0.18,
        delay: (k % WIN_COLS) * 0.07 + Math.floor(k / WIN_COLS) * 0.04,
      })),
    })),
    /** Storeys queued to light, and when. */
    queue: [] as { at: number; box: number }[],
    rings: [] as { x: number; y: number; born: number; rgb: RGB }[],
    /** Screen-space centre of each front face, for hit testing. */
    hit: [] as { x: number; y: number; halfW: number; halfH: number }[],
  });

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => {
      const st = S.current;
      if (!st.hit.length) return;

      let best = -1;
      let bd = Infinity;
      for (let i = 0; i < st.hit.length; i++) {
        const d = (st.hit[i].x - x) ** 2 + (st.hit[i].y - y) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;

      const now = performance.now();
      st.rings.push({ x: st.hit[best].x, y: st.hit[best].y, born: now, rgb: st.boxes[best].rgb });

      // light this storey, then carry it outward through the stack
      st.queue.push({ at: now, box: best });
      for (let step = 1; step < COUNT; step++) {
        if (best + step < COUNT) st.queue.push({ at: now + step * 170, box: best + step });
        if (best - step >= 0) st.queue.push({ at: now + step * 170, box: best - step });
      }
    },

    draw: ({ ctx, w, h, t, dt, pointer, reduced }) => {
      const st = S.current;
      const now = performance.now();

      // ── layout ──
      const unit = Math.min(w * 0.36, h * 0.17, 148);
      const boxH = unit * 0.44;
      const gap = boxH * 0.12;
      const cx = w * 0.55;
      const totalH = COUNT * (boxH + gap);
      const baseY = Math.min(h * 0.94, h * 0.5 + totalH / 2);

      const project = (bx: number, by: number, bz: number) => ({
        x: cx + bx * unit + bz * unit * DX,
        y: baseY - by + bz * unit * DY,
      });

      for (let i = st.queue.length - 1; i >= 0; i--) {
        if (now >= st.queue[i].at) {
          st.boxes[st.queue[i].box].since = 0;
          st.queue.splice(i, 1);
        }
      }

      st.hit = [];

      // ── the service core the volumes hang off ──
      const coreBot = project(0, 0, 0);
      const coreTop = project(0, totalH, 0);
      ctx.strokeStyle = rgba(mix(PALETTE.forest, PALETTE.sage, 0.4), 0.26);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(coreBot.x, coreBot.y);
      ctx.lineTo(coreTop.x, coreTop.y);
      ctx.stroke();

      // ── ground ──
      const g0 = project(-1.5, 0, 0);
      const g1 = project(1.5, 0, 0);
      const gg = ctx.createLinearGradient(g0.x, 0, g1.x, 0);
      gg.addColorStop(0, rgba(PALETTE.forest, 0));
      gg.addColorStop(0.5, rgba(PALETTE.forest, 0.3));
      gg.addColorStop(1, rgba(PALETTE.forest, 0));
      ctx.strokeStyle = gg;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(g0.x, g0.y);
      ctx.lineTo(g1.x, g1.y);
      ctx.stroke();

      const sway = reduced ? 0 : Math.sin(t * 0.45) * 0.012;

      // bottom up, so an upper volume overlaps the one carrying it
      for (let i = 0; i < COUNT; i++) {
        const b = st.boxes[i];
        b.since += dt;

        const lean = sway * (i / COUNT) * unit;
        const y0 = i * (boxH + gap);
        const y1 = y0 + boxH;
        const x0 = b.offX - b.w / 2;
        const x1 = b.offX + b.w / 2;
        const z0 = b.offZ - b.d / 2;
        const z1 = b.offZ + b.d / 2;

        const P = (x: number, yy: number, z: number) => {
          const q = project(x, yy, z);
          return { x: q.x + lean, y: q.y };
        };
        const c = {
          fbl: P(x0, y0, z0), fbr: P(x1, y0, z0), ftl: P(x0, y1, z0), ftr: P(x1, y1, z0),
          rbl: P(x0, y0, z1), rbr: P(x1, y0, z1), rtl: P(x0, y1, z1), rtr: P(x1, y1, z1),
        };

        const centre = { x: (c.fbl.x + c.ftr.x) / 2, y: (c.fbl.y + c.ftr.y) / 2 };
        const halfW = (b.w * unit) / 2;
        const halfH = boxH / 2;
        st.hit.push({ ...centre, halfW, halfH });

        const over =
          pointer.active &&
          Math.abs(pointer.x - centre.x) < halfW + 10 &&
          Math.abs(pointer.y - centre.y) < halfH + 10;

        // recently lit storeys stay bright, then fall back to a resting level
        const resting = i === 0 ? 0.3 : 0.12;
        const target = over ? 1 : b.since < 2.6 ? 1 : resting;
        b.glow += (target - b.glow) * Math.min(1, dt * (reduced ? 60 : 3.4));
        const lit = b.glow;

        // ── glazed faces ──
        const face = (pts: { x: number; y: number }[], a: number) => {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
          ctx.closePath();
          ctx.fillStyle = rgba(b.rgb, a);
          ctx.fill();
        };
        face([c.ftl, c.ftr, c.rtr, c.rtl], 0.07 + lit * 0.13); // roof
        face([c.fbr, c.ftr, c.rtr, c.rbr], 0.05 + lit * 0.11); // side
        face([c.fbl, c.fbr, c.ftr, c.ftl], 0.09 + lit * 0.21); // front

        // ── beams ──
        ctx.strokeStyle = rgba(b.rgb, 0.42 + lit * 0.5);
        ctx.lineWidth = 1 + lit * 0.9;
        ctx.beginPath();
        const beams: [{ x: number; y: number }, { x: number; y: number }][] = [
          [c.fbl, c.fbr], [c.fbr, c.ftr], [c.ftr, c.ftl], [c.ftl, c.fbl],
          [c.rbl, c.rbr], [c.rbr, c.rtr], [c.rtr, c.rtl], [c.rtl, c.rbl],
          [c.fbl, c.rbl], [c.fbr, c.rbr], [c.ftr, c.rtr], [c.ftl, c.rtl],
        ];
        for (const [p, q] of beams) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();

        // ── window nodes on the front face ──
        for (let k = 0; k < b.wins.length; k++) {
          const win = b.wins[k];
          const col = k % WIN_COLS;
          const row = Math.floor(k / WIN_COLS);
          const fx = x0 + ((col + 0.5) / WIN_COLS) * b.w;
          const fy = y0 + ((row + 0.7) / (WIN_ROWS + 0.4)) * boxH;
          const q = P(fx, fy, z0);

          let want = lit > 0.5 ? 1 : 0.2;
          if (b.since < 2.2 && !reduced) want = b.since > win.delay + 0.1 ? 1 : 0.2;
          win.lit += (want - win.lit) * Math.min(1, dt * (reduced ? 60 : 6));

          ctx.beginPath();
          ctx.fillStyle = rgba(
            mix(b.rgb, [255, 255, 255], 0.22 + win.lit * 0.3),
            0.35 + win.lit * 0.65
          );
          if (win.lit > 0.55) {
            ctx.shadowBlur = 9 + lit * 8;
            ctx.shadowColor = rgba(b.rgb, 0.9);
          }
          ctx.arc(q.x, q.y, 1.9 + win.lit * 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // ── corner nodes ──
        for (const key of ["fbl", "fbr", "ftl", "ftr", "rbl", "rbr", "rtl", "rtr"] as const) {
          const q = c[key];
          ctx.beginPath();
          ctx.fillStyle = rgba(mix(b.rgb, [255, 255, 255], lit * 0.35), 0.82 + lit * 0.18);
          if (lit > 0.4) {
            ctx.shadowBlur = lit * 14;
            ctx.shadowColor = rgba(b.rgb, 0.9);
          }
          ctx.arc(q.x, q.y, 2.4 + lit * 1.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ── rings where the tower was touched ──
      for (let i = st.rings.length - 1; i >= 0; i--) {
        const age = (now - st.rings[i].born) / 820;
        if (age >= 1) { st.rings.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.strokeStyle = rgba(st.rings[i].rgb, (1 - age) * 0.6);
        ctx.lineWidth = 2 * (1 - age);
        ctx.arc(st.rings[i].x, st.rings[i].y, 6 + age * 52, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── mast and beacon ──
      const topBox = st.boxes[COUNT - 1];
      const mast = project(topBox.offX, COUNT * (boxH + gap), topBox.offZ);
      ctx.strokeStyle = rgba(PALETTE.gold, 0.45);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(mast.x, mast.y);
      ctx.lineTo(mast.x, mast.y - 24);
      ctx.stroke();

      const beacon = reduced ? 0.6 : Math.sin(t * 2.1) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.fillStyle = rgba(PALETTE.gold, 0.5 + beacon * 0.5);
      ctx.shadowBlur = 6 + beacon * 12;
      ctx.shadowColor = rgba(PALETTE.gold, 0.9);
      ctx.arc(mast.x, mast.y - 26, 2.3 + beacon, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  });

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full cursor-pointer" aria-hidden="true" />
    </div>
  );
}
