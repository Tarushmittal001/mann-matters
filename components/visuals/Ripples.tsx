"use client";

import { useRef } from "react";

import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * Small drops, wide rings — for the Contact page.
 *
 * The headline there is "No question is too small." So: a tiny node falls onto
 * a still surface and opens into rings far larger than itself, which spread,
 * overlap, and are answered by the next one. Something small, met with
 * something much bigger than it. That is the promise of the page, and it is
 * the whole of the drawing.
 *
 * Drops arrive on their own, so the surface is never dead. **Click anywhere and
 * you drop your own** — larger, and it lands immediately.
 *
 * This one sits behind both columns of the contact layout rather than off to
 * one side, so it reads as the surface the page is written on.
 *
 * Mechanic is expanding rings with a falling node. No graph, lattice, flock,
 * plume or lane.
 */

type RGB = readonly [number, number, number];

/** The palette cycles, so no two neighbouring drops share a colour. */
const INKS: RGB[] = [
  [46, 140, 140], // teal
  [200, 164, 93], // gold
  [197, 106, 114], // rose
  [76, 111, 165], // indigo
  [125, 145, 80], // moss
  [155, 95, 138], // plum
  [95, 169, 138], // mint
];

type Drop = {
  x: number;
  y: number;
  rgb: RGB;
  born: number;
  /** How far the rings travel, in px. */
  reach: number;
  /** How long the node falls before it lands. */
  fall: number;
  /** A visitor's own drop lands harder. */
  own: boolean;
  /** Where in its life this drop sits when motion is switched off. */
  frozen: number;
};

const LIFE = 4200; // ms for a ring set to fade out

export default function Ripples({ className = "" }: { className?: string }) {
  const S = useRef({
    drops: [] as Drop[],
    next: 0,
    ink: 0,
    seeded: false,
  });

  const add = (x: number, y: number, own: boolean, reach: number) => {
    const st = S.current;
    st.drops.push({
      x,
      y,
      rgb: INKS[st.ink++ % INKS.length],
      born: performance.now(),
      reach,
      fall: own ? 0 : 320 + Math.random() * 240,
      own,
      frozen: 0.1 + Math.random() * 0.6,
    });
    if (st.drops.length > 22) st.drops.shift();
  };

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => add(x, y, true, 210),

    draw: ({ ctx, w, h, t, dt, pointer, reduced }) => {
      const st = S.current;
      const now = performance.now();

      // seed a few so the surface is never empty on arrival
      if (!st.seeded && w > 0) {
        st.seeded = true;
        for (let i = 0; i < 4; i++) {
          add(w * (0.04 + Math.random() * 0.54), h * (0.12 + Math.random() * 0.78), false, 140 + Math.random() * 120);
          st.drops[st.drops.length - 1].born = now - i * 900;
        }
      }

      // drops keep arriving on their own
      if (!reduced) {
        st.next -= dt;
        if (st.next <= 0) {
          st.next = 1.1 + Math.random() * 1.4;
          add(w * (0.03 + Math.random() * 0.56), h * (0.1 + Math.random() * 0.82), false, 130 + Math.random() * 140);
        }
      }

      for (let i = st.drops.length - 1; i >= 0; i--) {
        const d = st.drops[i];
        const elapsed = now - d.born;

        // ── the node falling in ──
        if (!reduced && elapsed < d.fall) {
          const p = elapsed / d.fall;
          const y = d.y - (1 - p) * (1 - p) * 90; // eases down under gravity
          ctx.beginPath();
          ctx.fillStyle = rgba(d.rgb, 0.35 + p * 0.55);
          ctx.arc(d.x, y, 1.6 + p * 1.2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        // with motion off the rings hold at a fixed radius rather than expanding
        const age = reduced ? d.frozen : (elapsed - d.fall) / LIFE;
        if (!reduced && age >= 1) { st.drops.splice(i, 1); continue; }

        // ── three rings, each trailing the last ──
        for (let k = 0; k < 3; k++) {
          const ringAge = age - k * 0.13;
          if (ringAge <= 0 || ringAge >= 1) continue;
          const eased = 1 - Math.pow(1 - ringAge, 2.1); // fast out, then slows
          const r = eased * d.reach * (d.own ? 1.35 : 1);
          const fade = (1 - ringAge) * (1 - k * 0.28) * (d.own ? 0.7 : 0.55);

          ctx.beginPath();
          ctx.strokeStyle = rgba(d.rgb, fade);
          ctx.lineWidth = (d.own ? 1.9 : 1.45) * (1 - ringAge * 0.7);
          ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // the node that started it, still sitting there, dimming
        ctx.beginPath();
        ctx.fillStyle = rgba(mix(d.rgb, [255, 255, 255], 0.2), (1 - age) * 0.75);
        if (age < 0.25) {
          ctx.shadowBlur = 10 * (1 - age / 0.25);
          ctx.shadowColor = rgba(d.rgb, 0.8);
        }
        ctx.arc(d.x, d.y, 2 + (1 - age) * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // the cursor disturbs the surface very slightly
      if (pointer.active && !reduced) {
        const wobble = Math.sin(t * 2.2) * 2;
        ctx.beginPath();
        ctx.strokeStyle = rgba(PALETTE.sage, 0.22);
        ctx.lineWidth = 1;
        ctx.arc(pointer.x, pointer.y, 15 + wobble, 0, Math.PI * 2);
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
