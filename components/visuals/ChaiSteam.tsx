"use client";

import { useRef } from "react";

import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * Steam off a cutting-chai glass, for the About page.
 *
 * The headline there is "We exist so that asking for help feels as ordinary as
 * asking for chai", so the drawing is that sentence's own image. Nothing about
 * it is clinical, which is the point.
 *
 * Two things make it read as steam rather than as scattered dots:
 *
 *   1. **Wisps, not particles.** Each plume is a continuous strand of nodes
 *      that curls — the lateral sway grows the higher it goes, and the phase
 *      drifts, so the strand coils the way real steam does.
 *   2. **Brightness travels up the strand.** Each node's alpha is driven by a
 *      wave moving along the wisp, so you see rising rather than a static
 *      squiggle. A few nodes break off at the top and drift free.
 *
 * The glass is drawn in nodes too, with an elliptical rim and base so it reads
 * as a vessel you can see into rather than a flat trapezoid. Colour carries the
 * heat leaving it: amber at the rim, cooling to sage as it disperses.
 *
 * **Click anywhere and a fresh wisp rises from that point**, as if something
 * else just got poured.
 */

type RGB = readonly [number, number, number];

const HOT: RGB = [214, 158, 66]; // amber, at the rim
const WARM: RGB = [201, 143, 118]; // rose-tan
const COOL: RGB = [152, 178, 164]; // sage, as it disperses
const TEA: RGB = [150, 92, 40];

/** Where along a wisp a node sits, and how it behaves there. */
const NODES_PER_WISP = 26;

type Wisp = {
  /** Offset from the glass centre where this strand leaves the rim, -1..1. */
  root: number;
  /** Absolute origin when a click spawned it. */
  fromX: number | null;
  fromY: number | null;
  curl: number;
  freq: number;
  speed: number;
  phase: number;
  /** How far up this one gets, 0..1 of the available rise. */
  height: number;
  /** Fades in on spawn, and out at the end of a click-spawned life. */
  born: number;
  life: number | null;
};

/** Loose nodes that have broken off the top of a wisp. */
type Drifter = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number };

export default function ChaiSteam({ className = "" }: { className?: string }) {
  const S = useRef({
    wisps: [] as Wisp[],
    drifters: [] as Drifter[],
    seeded: false,
    nextDrift: 0,
    rings: [] as { x: number; y: number; born: number }[],
  });

  const makeWisp = (root: number, fromX: number | null, fromY: number | null, life: number | null): Wisp => ({
    root,
    fromX,
    fromY,
    curl: 26 + Math.random() * 34,
    freq: 1.3 + Math.random() * 1.8,
    speed: 0.5 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    height: 0.72 + Math.random() * 0.28,
    born: performance.now(),
    life,
  });

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => {
      const st = S.current;
      st.rings.push({ x, y, born: performance.now() });
      st.wisps.push(makeWisp(0, x, y, 5200));
      st.wisps.push(makeWisp(0.3, x, y, 4600));
      if (st.wisps.length > 12) st.wisps.splice(0, st.wisps.length - 12);
    },

    draw: ({ ctx, w, h, t, dt, pointer, reduced }) => {
      const st = S.current;
      const now = performance.now();
      const time = reduced ? 0 : t;

      if (!st.seeded) {
        st.seeded = true;
        // the resting plume: a few strands off the rim, never expiring
        for (const root of [-0.62, -0.3, -0.02, 0.28, 0.58]) st.wisps.push(makeWisp(root, null, null, null));
      }

      // ── the glass ──
      const gw = Math.min(w * 0.3, 118);
      const gh = gw * 1.15;
      const cx = w * 0.55;
      const rimY = h * 0.62;
      const botY = rimY + gh;
      const taper = 0.68;

      const rimRx = gw / 2;
      const rimRy = rimRx * 0.24;
      const botRx = (gw * taper) / 2;
      const botRy = botRx * 0.26;

      const dot = (x: number, y: number, col: RGB, a: number, r = 1.7) => {
        ctx.beginPath();
        ctx.fillStyle = rgba(col, a);
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // the tea, seen through the rim
      ctx.beginPath();
      ctx.ellipse(cx, rimY + 5, rimRx * 0.93, rimRy * 0.93, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba(TEA, 0.34);
      ctx.fill();

      // body wash
      const body = ctx.createLinearGradient(0, rimY, 0, botY);
      body.addColorStop(0, rgba(HOT, 0.14));
      body.addColorStop(1, rgba(TEA, 0.1));
      ctx.beginPath();
      ctx.moveTo(cx - rimRx, rimY);
      ctx.lineTo(cx - botRx, botY);
      ctx.ellipse(cx, botY, botRx, botRy, 0, Math.PI, 0, true);
      ctx.lineTo(cx + rimRx, rimY);
      ctx.closePath();
      ctx.fillStyle = body;
      ctx.fill();

      const glassCol = mix(PALETTE.forest, HOT, 0.5);

      // rim, as an ellipse of nodes
      for (let i = 0; i < 34; i++) {
        const a = (i / 34) * Math.PI * 2;
        dot(cx + Math.cos(a) * rimRx, rimY + Math.sin(a) * rimRy, glassCol, 0.72, 1.8);
      }
      // base
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        dot(cx + Math.cos(a) * botRx, botY + Math.sin(a) * botRy, glassCol, 0.5, 1.5);
      }
      // the two sides
      for (let i = 0; i <= 12; i++) {
        const p = i / 12;
        const y = rimY + (botY - rimY) * p;
        const rx = rimRx + (botRx - rimRx) * p;
        dot(cx - rx, y, glassCol, 0.58, 1.6);
        dot(cx + rx, y, glassCol, 0.58, 1.6);
      }

      // saucer
      const sg = ctx.createLinearGradient(cx - gw, 0, cx + gw, 0);
      sg.addColorStop(0, rgba(PALETTE.forest, 0));
      sg.addColorStop(0.5, rgba(PALETTE.forest, 0.26));
      sg.addColorStop(1, rgba(PALETTE.forest, 0));
      ctx.strokeStyle = sg;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - gw * 0.95, botY + botRy + 6);
      ctx.lineTo(cx + gw * 0.95, botY + botRy + 6);
      ctx.stroke();

      // ── the wisps ──
      const riseH = h * 0.56;

      for (let i = st.wisps.length - 1; i >= 0; i--) {
        const wi = st.wisps[i];
        const alive = now - wi.born;
        if (wi.life !== null && alive > wi.life) { st.wisps.splice(i, 1); continue; }

        // fade in on spawn, and out at the end of a temporary wisp's life
        let envelope = Math.min(1, alive / 700);
        if (wi.life !== null) envelope *= Math.min(1, (wi.life - alive) / 1200);

        const baseX = wi.fromX ?? cx + wi.root * rimRx * 0.8;
        const baseY = wi.fromY ?? rimY - rimRy - 2;

        for (let k = 0; k < NODES_PER_WISP; k++) {
          const u = k / (NODES_PER_WISP - 1); // 0 at the rim, 1 at the top

          // the strand coils: sway grows with height, and the phase drifts
          const sway =
            Math.sin(u * wi.freq * Math.PI * 2 + wi.phase + time * wi.speed) * wi.curl * Math.pow(u, 1.25) +
            Math.sin(u * wi.freq * 3.1 + wi.phase * 2 - time * wi.speed * 0.7) * wi.curl * 0.3 * Math.pow(u, 1.6);

          const x = baseX + sway;
          const y = baseY - riseH * wi.height * Math.pow(u, 0.86);

          // brightness travels up the strand, so it reads as rising
          const travel = 0.45 + 0.55 * Math.sin(u * 7 - time * 2.1 + wi.phase);
          // and the whole strand thins out toward the top
          const fade = Math.pow(1 - u, 1.25);

          const col = u < 0.4 ? mix(HOT, WARM, u / 0.4) : mix(WARM, COOL, (u - 0.4) / 0.6);
          let alpha = fade * travel * 0.62 * envelope;

          // the cursor parts the steam
          let px = x;
          if (pointer.active && !reduced) {
            const d = Math.hypot(x - pointer.x, y - pointer.y);
            if (d < 86) {
              const push = (1 - d / 86) * 26;
              px = x + (x >= pointer.x ? push : -push);
              alpha *= 0.75;
            }
          }

          if (alpha < 0.015) continue;
          const r = (1.5 + u * 2.4) * (0.75 + travel * 0.4);
          if (u < 0.22) {
            ctx.shadowBlur = 7;
            ctx.shadowColor = rgba(HOT, 0.4);
          }
          dot(px, y, col, alpha, r);
          ctx.shadowBlur = 0;
        }
      }

      // ── nodes that break off the top and drift away ──
      if (!reduced) {
        st.nextDrift -= dt;
        if (st.nextDrift <= 0 && st.wisps.length) {
          st.nextDrift = 0.34 + Math.random() * 0.5;
          const wi = st.wisps[(Math.random() * st.wisps.length) | 0];
          const baseX = wi.fromX ?? cx + wi.root * rimRx * 0.8;
          const baseY = wi.fromY ?? rimY - rimRy - 2;
          st.drifters.push({
            x: baseX + (Math.random() - 0.5) * wi.curl * 1.6,
            y: baseY - riseH * wi.height * 0.92,
            vx: (Math.random() - 0.5) * 16,
            vy: -8 - Math.random() * 12,
            age: 0,
            life: 2.4 + Math.random() * 1.8,
            size: 1.4 + Math.random() * 1.6,
          });
          if (st.drifters.length > 26) st.drifters.shift();
        }
        for (let i = st.drifters.length - 1; i >= 0; i--) {
          const d = st.drifters[i];
          d.age += dt;
          if (d.age >= d.life) { st.drifters.splice(i, 1); continue; }
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.vx += Math.sin(t * 1.4 + d.y * 0.02) * 6 * dt;
          const p = d.age / d.life;
          dot(d.x, d.y, COOL, (1 - p) * 0.3, d.size * (1 + p * 1.4));
        }
      }

      // ── ring where a fresh cup was poured ──
      for (let i = st.rings.length - 1; i >= 0; i--) {
        const age = (now - st.rings[i].born) / 760;
        if (age >= 1) { st.rings.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.strokeStyle = rgba(HOT, (1 - age) * 0.5);
        ctx.lineWidth = 1.8 * (1 - age);
        ctx.arc(st.rings[i].x, st.rings[i].y, 5 + age * 40, 0, Math.PI * 2);
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
