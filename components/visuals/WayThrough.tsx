"use client";

import { useRef } from "react";

import { services } from "@/lib/services";
import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * "However it shows up, there's a way through." — drawn.
 *
 * One lane per service. Each begins on the left as an agitated, colourless
 * jitter and settles, left to right, into a steady line **in its own colour**.
 * The colour is the resolution: distress arrives undifferentiated, and finding
 * the right format is what gives it a shape and a name.
 *
 * That is the same system the brain on the home page uses — colour as identity,
 * revealed by interaction rather than spent by default — so the two read as one
 * family without being the same drawing.
 *
 * Every lane is read from `lib/services.ts`, so the picture is the offer:
 *
 *   • **colour = which format.** Rose for couples and indigo for students match
 *     the brain's limbic and frontal regions, so the palette agrees across pages.
 *   • **strand count = who is in the room.** Individual is one line. Couples is
 *     two, starting apart and converging into one by the time they settle.
 *     Groups is four, which sync up without merging — you stay yourself.
 *   • **lane length = session duration.** The 90-minute group lane runs further
 *     than the 45-minute student lane. Add a service and a lane appears.
 *
 * Hover a lane to help it settle. **Click one** and a burst leaves your cursor,
 * a lit front travels the lane calming it as it goes, and the arrival point
 * flares when it lands.
 *
 * Mechanic is decaying layered-sine noise along an axis — no particles, no
 * graph, no orbit.
 */

type RGB = readonly [number, number, number];

/**
 * Per-service identity. Drawn from the same muted family as the brain's regions
 * so nothing on the site reads as a different palette.
 */
const LOOK: Record<string, { rgb: RGB; strands: number }> = {
  // teal — one-on-one clarity
  "individual-therapy": { rgb: [46, 140, 140], strands: 1 },
  // rose — the brain's limbic colour: joy, fear, love
  "couples-counseling": { rgb: [197, 106, 114], strands: 2 },
  // indigo — the brain's frontal colour: focus and planning
  "student-support": { rgb: [76, 111, 165], strands: 1 },
  // moss — steadiness
  "corporate-wellness": { rgb: [125, 145, 80], strands: 3 },
  // plum — many voices
  "group-sessions": { rgb: [155, 95, 138], strands: 4 },
};

const FALLBACK: { rgb: RGB; strands: number } = { rgb: PALETTE.gold, strands: 1 };

/** Minutes, for lane length. "Custom programs" has no number — give it a middling lane. */
function minutesOf(duration: string): number {
  const m = /(\d+)/.exec(duration);
  return m ? Number(m[1]) : 60;
}

type Lane = {
  slug: string;
  rgb: RGB;
  strands: number;
  /** 0..1 — share of the width this lane runs for. */
  reach: number;
  /** Vertical centre, 0..1 of height. */
  y: number;
  seed: number;
  glow: number;
  /** -1 idle; otherwise 0 → 1.4 as the settling front travels the lane. */
  wave: number;
  /** Overall lane brightness after a click, eased back down. */
  flash: number;
  /** The ring that leaves the cursor. */
  burst: { x: number; y: number; born: number } | null;
  /** When the front reached the end, for the arrival flare. */
  arrived: number;
};

const SAMPLES = 86;
const WAVE_SPEED = 0.85; // lane-lengths per second

export default function WayThrough({ className = "" }: { className?: string }) {
  const S = useRef({
    lanes: (() => {
      const longest = Math.max(...services.map((s) => minutesOf(s.duration)));
      return services.map((s, i): Lane => {
        const look = LOOK[s.slug] ?? FALLBACK;
        return {
          slug: s.slug,
          rgb: look.rgb,
          strands: look.strands,
          reach: 0.5 + 0.44 * (minutesOf(s.duration) / longest),
          // 0.22–0.9 of height: above that sits under the fixed navbar
          y: 0.22 + (0.68 * i) / Math.max(1, services.length - 1),
          seed: i * 37.13,
          glow: 0,
          wave: -1,
          flash: 0,
          burst: null,
          arrived: -1,
        };
      });
    })(),
  });

  /** The lane's centre-line offset at position `p`, so overlays sit on the line. */
  const offsetAt = (lane: Lane, p: number, t: number, reduced: boolean, strand = 0) => {
    let calm = Math.pow(1 - p, 1.7);
    if (lane.wave >= 0 && p < lane.wave) {
      calm *= Math.max(0.12, 1 - (lane.wave - p) * 2.6);
    }
    calm *= 1 - lane.glow * 0.55;
    const time = reduced ? 0 : t;
    const jitter =
      Math.sin(p * 13 + lane.seed + time * 2.1 + strand) * 17 +
      Math.sin(p * 29 + lane.seed * 1.7 - time * 3.3) * 9 +
      Math.sin(p * 61 + lane.seed * 0.6 + time * 1.4) * 4.5;
    return jitter * calm;
  };

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => {
      let best: Lane | null = null;
      let bd = Infinity;
      const h = wrapRef.current?.clientHeight ?? 1;
      for (const l of S.current.lanes) {
        const d = Math.abs(l.y * h - y);
        if (d < bd) { bd = d; best = l; }
      }
      if (!best) return;
      best.wave = 0;
      best.flash = 1;
      best.arrived = -1;
      best.burst = { x, y, born: performance.now() };
    },

    draw: ({ ctx, w, h, t, dt, pointer, reduced }) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const now = performance.now();

      for (const lane of S.current.lanes) {
        const laneY = lane.y * h;
        const endX = w * lane.reach;

        let near = 0;
        if (pointer.active) {
          const d = Math.abs(pointer.y - laneY);
          if (d < 46) near = 1 - d / 46;
        }
        lane.glow += (near - lane.glow) * Math.min(1, dt * 6);
        lane.flash = Math.max(0, lane.flash - dt * 0.8);

        if (lane.wave >= 0) {
          // reduced motion still resolves the lane, just without the travel
          lane.wave = reduced ? 1.4 : lane.wave + dt * WAVE_SPEED;
          if (lane.arrived < 0 && lane.wave >= 1) lane.arrived = now;
          if (lane.wave > 1.4) lane.wave = -1;
        }

        const lit = Math.max(lane.glow, lane.flash);

        /* ── the strands ── */
        for (let s = 0; s < lane.strands; s++) {
          const spread = (s - (lane.strands - 1) / 2) * 9;

          ctx.beginPath();
          for (let i = 0; i <= SAMPLES; i++) {
            const p = i / SAMPLES;
            const x = p * endX;
            const y =
              laneY + spread * Math.pow(1 - p, 0.8) + offsetAt(lane, p, t, reduced, s);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // colourless where it arrives, its own colour where it resolves
          const grad = ctx.createLinearGradient(0, 0, endX, 0);
          const raw = mix(PALETTE.forest, PALETTE.sage, 0.3);
          const own = lane.rgb;
          grad.addColorStop(0, rgba(raw, 0.3 + lit * 0.25));
          grad.addColorStop(0.45, rgba(mix(raw, own, 0.55), 0.42 + lit * 0.3));
          grad.addColorStop(1, rgba(mix(own, [255, 255, 255], lit * 0.25), 0.78 + lit * 0.22));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.3 + lit * 1.1;
          ctx.stroke();
        }

        /* ── the front travelling the lane, and the trail behind it ── */
        if (lane.wave >= 0 && lane.wave <= 1.05 && !reduced) {
          const p = Math.min(1, lane.wave);
          const fx = p * endX;
          const fy = laneY + offsetAt(lane, p, t, reduced);

          // a short bright trail, so the front reads as travelling
          ctx.beginPath();
          for (let k = 0; k <= 12; k++) {
            const bp = Math.max(0, p - k * 0.022);
            const bx = bp * endX;
            const by = laneY + offsetAt(lane, bp, t, reduced);
            if (k === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
          }
          ctx.strokeStyle = rgba(mix(lane.rgb, [255, 255, 255], 0.35), 0.55);
          ctx.lineWidth = 2.4;
          ctx.stroke();

          ctx.beginPath();
          ctx.fillStyle = rgba(mix(lane.rgb, [255, 255, 255], 0.4), 1);
          ctx.shadowBlur = 16;
          ctx.shadowColor = rgba(lane.rgb, 0.9);
          ctx.arc(fx, fy, 3.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        /* ── the burst that leaves the cursor ── */
        if (lane.burst) {
          const age = (now - lane.burst.born) / 640;
          if (age >= 1) {
            lane.burst = null;
          } else {
            ctx.beginPath();
            ctx.strokeStyle = rgba(lane.rgb, (1 - age) * 0.6);
            ctx.lineWidth = 2 * (1 - age);
            ctx.arc(lane.burst.x, lane.burst.y, 4 + age * 46, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        /* ── arrival ── */
        const arriveAge = lane.arrived > 0 ? (now - lane.arrived) / 900 : 1;
        if (arriveAge < 1) {
          ctx.beginPath();
          ctx.strokeStyle = rgba(lane.rgb, (1 - arriveAge) * 0.65);
          ctx.lineWidth = 2 * (1 - arriveAge);
          ctx.arc(endX, laneY, 3 + arriveAge * 30, 0, Math.PI * 2);
          ctx.stroke();
        }
        const land = arriveAge < 1 ? 1 - arriveAge : 0;

        ctx.beginPath();
        ctx.fillStyle = rgba(mix(lane.rgb, [255, 255, 255], land * 0.4), 0.8 + lit * 0.2);
        if (lit > 0.02 || land > 0.02) {
          ctx.shadowBlur = (lit + land) * 16;
          ctx.shadowColor = rgba(lane.rgb, 0.85);
        }
        ctx.arc(endX, laneY, 2.8 + lit * 2.2 + land * 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    },
  });

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full cursor-pointer" aria-hidden="true" />
    </div>
  );
}
