"use client";

import { useRef } from "react";

import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * An open handbook on a desk, drawn in the same node-and-beam language as the
 * rest of the site's canvases.
 *
 * This replaced `NodeBuilding`, a stack of cantilevered volumes (deleted with
 * it; in git history if it's ever wanted back). The tower said "we build
 * something structural"; it did not say who for. A book does both jobs at once
 * — it is the object an institution actually ends up holding, and its pages can
 * carry the three kinds of building we work in.
 *
 * The right page is a drawing: a school, a campus, an office tower, elevation
 * style, in nodes and beams. It turns on its own every few seconds, and the
 * three markers on the fore-edge jump straight to a chapter — so the visual is
 * literally indexed by institution type.
 *
 * Drawn in axonometric projection: `project()` maps (across, up, depth) to the
 * canvas, so the pages are real planes and the turning sheet sweeps through the
 * space above them rather than sliding flat.
 *
 * Reduced motion: the auto-turn and the paper curl stop, the book sits open on
 * its chapter, and the markers still work — the preference is about movement,
 * not about taking the thing away.
 */

type RGB = readonly [number, number, number];

/* Warm at the front of the book, cool at the back — the same amber → lime →
   forest run the tower used, so nothing here is a new colour on this page. */
const CHAPTERS: { rgb: RGB }[] = [
  { rgb: [214, 158, 66] }, // schools
  { rgb: [166, 186, 74] }, // campuses
  { rgb: [32, 104, 74] }, // offices
];

/** Depth direction on screen: how far one unit of depth moves right, and up.
 *  Steeper than the tower's, because a book is read from above: at the tower's
 *  shallow angle the open spread collapses to a slab and stops being a book. */
const DX = 0.3;
const DY = -0.66;

/* Book geometry, in world units. */
const W = 1; // spine → fore-edge, per page
const D = 0.72; // half the depth of the spread
const SPINE_H = 0.15; // the fold sits above the outer edges
const RISE = 0.62; // how high a turning sheet climbs, foreshortened
const SHEETS = 7; // page edges drawn under each leaf

const SECONDS_PER_PAGE = 4.6;

type Point = { x: number; y: number };

/** A line drawing on a page, in [0,1]² — x runs spine → fore-edge, y front → back. */
type Glyph = {
  /** Closed or open polylines. */
  lines: [number, number][][];
  /** Node dots, drawn brighter than the beams. */
  nodes: [number, number][];
  /** Little filled squares — windows. */
  wins: [number, number][];
};

const SCHOOL: Glyph = {
  lines: [
    [[0.12, 0.06], [0.88, 0.06], [0.88, 0.5], [0.12, 0.5], [0.12, 0.06]],
    [[0.05, 0.5], [0.5, 0.78], [0.95, 0.5]],
    [[0.44, 0.06], [0.44, 0.25], [0.56, 0.25], [0.56, 0.06]],
    [[0.5, 0.78], [0.5, 0.95]],
    [[0.5, 0.95], [0.63, 0.9], [0.5, 0.85]],
    [[0.02, 0.06], [0.98, 0.06]],
  ],
  nodes: [
    [0.12, 0.06], [0.88, 0.06], [0.12, 0.5], [0.88, 0.5],
    [0.05, 0.5], [0.95, 0.5], [0.5, 0.78], [0.5, 0.95],
  ],
  wins: [[0.24, 0.3], [0.36, 0.3], [0.64, 0.3], [0.76, 0.3]],
};

const CAMPUS: Glyph = {
  lines: [
    [[0.06, 0.08], [0.35, 0.08], [0.35, 0.6], [0.06, 0.6], [0.06, 0.08]],
    [[0.63, 0.08], [0.94, 0.08], [0.94, 0.74], [0.63, 0.74], [0.63, 0.08]],
    [[0.35, 0.44], [0.63, 0.44]],
    [[0.35, 0.54], [0.63, 0.54]],
    [[0.02, 0.08], [0.98, 0.08]],
    [[0.44, 0.08], [0.44, 0.2], [0.54, 0.2], [0.54, 0.08]],
  ],
  nodes: [
    [0.06, 0.08], [0.35, 0.08], [0.06, 0.6], [0.35, 0.6],
    [0.63, 0.08], [0.94, 0.08], [0.63, 0.74], [0.94, 0.74],
  ],
  wins: [
    [0.14, 0.24], [0.27, 0.24], [0.14, 0.42], [0.27, 0.42],
    [0.71, 0.24], [0.86, 0.24], [0.71, 0.62], [0.86, 0.62],
  ],
};

const OFFICE: Glyph = {
  lines: [
    [[0.31, 0.05], [0.69, 0.05], [0.69, 0.88], [0.31, 0.88], [0.31, 0.05]],
    [[0.31, 0.2], [0.69, 0.2]],
    [[0.31, 0.35], [0.69, 0.35]],
    [[0.31, 0.5], [0.69, 0.5]],
    [[0.31, 0.65], [0.69, 0.65]],
    [[0.31, 0.77], [0.69, 0.77]],
    [[0.5, 0.05], [0.5, 0.88]],
    [[0.5, 0.88], [0.5, 0.99]],
    [[0.02, 0.05], [0.98, 0.05]],
    [[0.43, 0.05], [0.43, 0.15], [0.57, 0.15], [0.57, 0.05]],
  ],
  nodes: [
    [0.31, 0.05], [0.69, 0.05], [0.31, 0.88], [0.69, 0.88], [0.5, 0.99],
  ],
  wins: [
    [0.38, 0.27], [0.62, 0.27], [0.38, 0.42], [0.62, 0.42],
    [0.38, 0.57], [0.62, 0.57], [0.38, 0.71], [0.62, 0.71],
  ],
};

const GLYPHS = [SCHOOL, CAMPUS, OFFICE];

export default function OpenHandbook({ className = "" }: { className?: string }) {
  const S = useRef({
    /** Which chapter the open spread is showing. */
    chapter: 0,
    /** 0 → spread at rest; runs to 1 as one sheet crosses the spine. */
    turn: 0,
    turning: false,
    /** Seconds the spread has been at rest — drives the automatic turn. */
    idle: 0,
    /** Hover lift, eased. */
    lift: 0,
    /** Fore-edge markers, in canvas space, refreshed every frame for hit-testing. */
    tabs: [] as { x: number; y: number; r: number }[],
    /** Node dots lighting in sequence after a chapter lands. */
    since: 99,
    rings: [] as { x: number; y: number; born: number; rgb: RGB }[],
  });

  const startTurn = (to: number) => {
    const st = S.current;
    if (st.turning) return;
    st.chapter = (to + CHAPTERS.length) % CHAPTERS.length;
    st.turning = true;
    st.turn = 0;
    st.idle = 0;
  };

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => {
      const st = S.current;
      // a marker jumps straight to its chapter; anywhere else turns one page on
      for (let i = 0; i < st.tabs.length; i++) {
        const tab = st.tabs[i];
        if (Math.hypot(x - tab.x, y - tab.y) < tab.r + 12) {
          if (i !== st.chapter) startTurn(i);
          st.rings.push({ x: tab.x, y: tab.y, born: performance.now(), rgb: CHAPTERS[i].rgb });
          return;
        }
      }
      startTurn(S.current.chapter + 1);
      st.rings.push({
        x,
        y,
        born: performance.now(),
        rgb: CHAPTERS[S.current.chapter].rgb,
      });
    },

    draw({ ctx, w, h, t, dt, pointer, reduced, quality }) {
      const st = S.current;
      const now = performance.now();

      // the spread is ~2.6 units across once the depth skew is counted, so the
      // width factor has to stay under 0.4 or the cover clips its own column
      const unit = Math.min(w * 0.38, h * 0.26);
      const cx = w * 0.5;
      const cy = h * 0.5;

      const project = (x: number, y: number, z: number): Point => ({
        x: cx + (x + z * DX) * unit,
        y: cy - y * unit + z * DY * unit,
      });

      /* ── state ─────────────────────────────────────────────────── */

      const overBook =
        pointer.active &&
        Math.abs(pointer.x - cx) < unit * 1.5 &&
        Math.abs(pointer.y - cy) < unit * 0.95;
      st.lift += ((overBook ? 1 : 0) - st.lift) * Math.min(1, dt * 5);

      if (st.turning) {
        // ease-out so the sheet lands rather than stopping dead
        st.turn += dt * (reduced ? 4 : 1.15);
        if (st.turn >= 1) {
          st.turn = 0;
          st.turning = false;
          st.since = 0;
        }
      } else {
        st.idle += dt;
        st.since += dt;
        if (!reduced && st.idle > SECONDS_PER_PAGE) startTurn(st.chapter + 1);
      }

      const chapter = CHAPTERS[st.chapter];
      const prevChapter = CHAPTERS[(st.chapter - 1 + CHAPTERS.length) % CHAPTERS.length];
      const lift = st.lift * 0.05;
      const spineH = SPINE_H + lift;

      /* ── page geometry ─────────────────────────────────────────── */

      /** A point on a resting leaf. `u` runs spine → fore-edge, `v` front → back. */
      const leaf = (side: -1 | 1, u: number, v: number): Point =>
        project(side * u * W, spineH * (1 - u) + lift * 0.4, v * D);

      const quad = (pts: Point[], fill: string, stroke?: string, lw = 1) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      };

      /* ── the shadow the book sits in ───────────────────────────── */
      const base = project(0, 0, 0);
      ctx.save();
      ctx.translate(base.x, base.y + unit * 0.16);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.fillStyle = rgba(PALETTE.forest, 0.1 + st.lift * 0.03);
      ctx.filter = quality.lite ? "none" : "blur(6px)";
      ctx.arc(0, 0, unit * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = "none";
      ctx.restore();

      /* ── covers, under both leaves ─────────────────────────────── */
      // a narrow overhang only: at 1.06 the dark board swallowed the pages and
      // the whole thing read as one green slab
      for (const side of [-1, 1] as const) {
        const drop = 0.05;
        const over = 1.035;
        const c = [
          project(side * over * W, -drop, -D * over),
          project(0, spineH - drop, -D * over),
          project(0, spineH - drop, D * over),
          project(side * over * W, -drop, D * over),
        ];
        quad(c, rgba(PALETTE.forestDeep, 0.92), rgba(PALETTE.forestDeep, 0.95), 1.2);
      }

      /* ── the block of pages, drawn as stacked fore-edges ───────── */
      for (const side of [-1, 1] as const) {
        for (let k = SHEETS; k >= 1; k--) {
          const drop = (k / SHEETS) * 0.045;
          const a = 0.16 + (1 - k / SHEETS) * 0.3;
          ctx.beginPath();
          const p0 = project(side * W, -drop, -D);
          const p1 = project(side * W, -drop, D);
          const p2 = project(0, spineH - drop, D);
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = rgba(PALETTE.sage, a);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      /* ── the two open leaves ───────────────────────────────────── */
      for (const side of [-1, 1] as const) {
        // paper has to be paper: at half opacity over ivory the leaves read as
        // part of the cover instead of as pages
        quad(
          [leaf(side, 1, -1), leaf(side, 0, -1), leaf(side, 0, 1), leaf(side, 1, 1)],
          `rgba(255,253,249,${0.93 + st.lift * 0.05})`,
          rgba(PALETTE.forest, 0.26),
          1.1
        );
      }

      /* ── left leaf: ruled lines, standing in for the writing ───── */
      {
        const rows = 9;
        for (let r = 0; r < rows; r++) {
          const v = -0.78 + (r / (rows - 1)) * 1.56;
          // ragged right edge, so it reads as prose rather than a table
          const len = 0.78 - (r % 3) * 0.12 - (r === rows - 1 ? 0.26 : 0);
          const a = project(-0.86 * W, spineH * (1 - 0.86) + lift * 0.4, v * D);
          const b = leaf(-1, 0.86 - len, v);
          ctx.beginPath();
          ctx.strokeStyle = rgba(PALETTE.ink, 0.16);
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // the node that starts each line lights in sequence after a turn
          const delay = 0.05 * r;
          const on = reduced ? 1 : st.since > delay ? Math.min(1, (st.since - delay) * 3) : 0;
          ctx.beginPath();
          ctx.fillStyle = rgba(mix(PALETTE.sage, chapter.rgb, on), 0.35 + on * 0.5);
          ctx.arc(a.x, a.y, 1.5 + on * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── right leaf: the building for this chapter ─────────────── */
      const drawGlyph = (index: number, alpha: number) => {
        if (alpha <= 0.01) return;
        const g = GLYPHS[index];
        const rgb = CHAPTERS[index].rgb;
        /** Glyph space → the right leaf, inset so the drawing keeps a margin
         *  and never runs off the fore-edge onto the cover. */
        const at = (gx: number, gy: number) =>
          leaf(1, 0.15 + gx * 0.7, -0.7 + gy * 1.4);

        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = rgba(rgb, alpha * (0.82 + st.lift * 0.18));
        ctx.lineWidth = 1.7;
        for (const line of g.lines) {
          ctx.beginPath();
          const p0 = at(line[0][0], line[0][1]);
          ctx.moveTo(p0.x, p0.y);
          for (let i = 1; i < line.length; i++) {
            const p = at(line[i][0], line[i][1]);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        for (const [gx, gy] of g.wins) {
          const p = at(gx, gy);
          const on = reduced ? 1 : Math.min(1, Math.max(0, st.since - 0.35) * 2);
          ctx.beginPath();
          ctx.fillStyle = rgba(mix(rgb, [255, 255, 255], 0.25), alpha * (0.3 + on * 0.6));
          ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const [gx, gy] of g.nodes) {
          const p = at(gx, gy);
          ctx.beginPath();
          ctx.fillStyle = rgba(rgb, alpha * (0.75 + st.lift * 0.25));
          if (st.lift > 0.2) {
            ctx.shadowBlur = quality.lite ? 0 : st.lift * 10;
            ctx.shadowColor = rgba(rgb, 0.8);
          }
          ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      };

      // mid-turn the sheet hides the right leaf, so the swap happens under it
      const revealed = st.turning ? (st.turn < 0.5 ? 0 : (st.turn - 0.5) * 2) : 1;
      drawGlyph(st.chapter, revealed);

      /* ── the sheet crossing the spine ──────────────────────────── */
      if (st.turning) {
        const e = st.turn * st.turn * (3 - 2 * st.turn); // smoothstep
        const theta = e * Math.PI;
        const curl = reduced ? 0 : Math.sin(theta) * 0.07;

        const sheet = (u: number, v: number): Point => {
          const x = u * W * Math.cos(theta);
          const y =
            spineH +
            u * W * Math.abs(Math.sin(theta)) * RISE -
            u * spineH * Math.abs(Math.cos(theta)) +
            curl * Math.sin(Math.PI * u);
          return project(x, y, v * D);
        };

        const N = 14;
        const front: Point[] = [];
        const back: Point[] = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          front.push(sheet(u, -1));
          back.push(sheet(u, 1));
        }

        ctx.beginPath();
        ctx.moveTo(front[0].x, front[0].y);
        for (const p of front) ctx.lineTo(p.x, p.y);
        for (let i = back.length - 1; i >= 0; i--) ctx.lineTo(back[i].x, back[i].y);
        ctx.closePath();
        // the raised sheet catches more light than the pages lying flat
        ctx.fillStyle = `rgba(255,255,255,${0.62 + Math.sin(theta) * 0.2})`;
        ctx.fill();
        ctx.strokeStyle = rgba(PALETTE.forest, 0.32);
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // the leaving chapter, still on the back of the sheet as it lifts
        const leaving = 1 - Math.min(1, e * 2.1);
        if (leaving > 0.02) {
          ctx.save();
          ctx.globalAlpha = leaving * 0.5;
          ctx.strokeStyle = rgba(prevChapter.rgb, 0.5);
          ctx.lineWidth = 1;
          for (let i = 2; i <= N - 2; i += 3) {
            ctx.beginPath();
            ctx.moveTo(front[i].x, front[i].y);
            ctx.lineTo(back[i].x, back[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      /* ── fore-edge markers: one per chapter ────────────────────── */
      st.tabs = [];
      for (let i = 0; i < CHAPTERS.length; i++) {
        const v = -0.5 + i * 0.5;
        const active = i === st.chapter;
        const out = active ? 1.13 : 1.06;
        const a = leaf(1, out, v);
        // starts at the fore-edge, not inside the page — running it under the
        // paper made the markers read as stray rules across the drawing
        const b = leaf(1, 1, v);

        const over =
          pointer.active && Math.hypot(pointer.x - a.x, pointer.y - a.y) < 14;

        ctx.beginPath();
        ctx.strokeStyle = rgba(CHAPTERS[i].rgb, active ? 0.9 : over ? 0.7 : 0.4);
        ctx.lineWidth = active ? 2.4 : 1.6;
        ctx.lineCap = "round";
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = rgba(CHAPTERS[i].rgb, active ? 1 : over ? 0.85 : 0.55);
        if (active) {
          ctx.shadowBlur = quality.lite ? 0 : 10;
          ctx.shadowColor = rgba(CHAPTERS[i].rgb, 0.85);
        }
        ctx.arc(a.x, a.y, active ? 3.6 : 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        st.tabs.push({ x: a.x, y: a.y, r: active ? 3.6 : 2.6 });
      }

      /* ── the ribbon, and the beacon the tower used to carry ────── */
      {
        // it stays in the gutter and drapes off the front of the spine. Any
        // route from the spine to a fore-edge has to cross a page, and a gold
        // line through the drawing is the one thing the eye goes to first.
        const top = project(0, spineH, D * 0.5);
        const mid = project(0.03 * W, spineH * 0.5, -D * 0.55);
        const end = project(0.1 * W, -0.12, -D * 1.16);

        ctx.beginPath();
        ctx.strokeStyle = rgba(PALETTE.gold, 0.62);
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        ctx.moveTo(top.x, top.y);
        ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
        ctx.stroke();

        const beacon = reduced ? 0.6 : Math.sin(t * 2.1) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.fillStyle = rgba(PALETTE.gold, 0.5 + beacon * 0.5);
        ctx.shadowBlur = quality.lite ? 0 : 6 + beacon * 12;
        ctx.shadowColor = rgba(PALETTE.gold, 0.9);
        ctx.arc(end.x, end.y, 2.3 + beacon, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      /* ── rings where the book was touched ──────────────────────── */
      for (let i = st.rings.length - 1; i >= 0; i--) {
        const age = (now - st.rings[i].born) / 820;
        if (age >= 1) {
          st.rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.strokeStyle = rgba(st.rings[i].rgb, (1 - age) * 0.55);
        ctx.lineWidth = 2 * (1 - age);
        ctx.arc(st.rings[i].x, st.rings[i].y, 6 + age * 48, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
  });

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full cursor-pointer" aria-hidden="true" />
    </div>
  );
}
