"use client";

import { useRef } from "react";

import { services } from "@/lib/services";
import { regionFor } from "@/lib/palette";
import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * "Ten kinds of support, one standard." — drawn as the room each one happens in.
 *
 * Six chairs, and they never leave. They walk into a new arrangement every few
 * seconds: two chairs facing for individual therapy, two side by side across
 * from one for couples, a desk and a lamp for a student, a ring for a group.
 * The arrangement *is* the format, so it reads
 * without a legend — and because the same six chairs make every one of them, the picture
 * says the thing the subhead says: one standard, different rooms.
 *
 * It replaced `WayThrough` (deleted with it; in git history), which drew a
 * settling lane per service in the same colours.
 * Those colours are kept here — teal, rose, indigo, moss, plum, matched to the
 * home page's brain regions — so a service means the same colour site-wide even
 * though the drawing changed.
 *
 * Axonometric, like the rest of the canvases: `project()` maps (across, up,
 * depth) to the screen, so a chair is a real seat, back and four legs rather
 * than a symbol of one.
 *
 * Hover to slow the room down and light it. Click a chair — or any of the
 * markers below the floor — to move to that format.
 */

type RGB = readonly [number, number, number];

/**
 * One colour per service, read from the shared brain palette rather than
 * re-typed here — this file used to keep its own copy, which meant a service
 * could be teal on the cards and plum in the hero of the same page.
 */
const LOOK: Record<string, RGB> = Object.fromEntries(
  services.map((s) => [s.slug, regionFor(s.slug).rgb])
);

const CHAIRS = 6; // the group ring is the widest room, and it seats six
const SECONDS_PER_ROOM = 5.2;

/** Depth on screen: how far one unit of depth moves right, and up. */
const DX = 0.52;
const DY = -0.44;

type Seat = { x: number; z: number; a: number; on: number };

/** A table, desk or rug the arrangement needs. */
type Prop =
  | { kind: "table"; x: number; z: number; w: number; d: number }
  | { kind: "round"; x: number; z: number; r: number }
  | { kind: "lamp"; x: number; z: number }
  | { kind: "rug"; x: number; z: number; r: number };

type Room = { seats: Seat[]; props: Prop[] };

/** Chairs in a ring, all facing the middle. */
function ring(n: number, r: number): Seat[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(t) * r, z: Math.sin(t) * r, a: t + Math.PI, on: 1 };
  });
}

/**
 * The rooms, in the order `lib/services.ts` lists them. `a` is the
 * direction the chair faces, measured in the floor plane.
 */
const ROOMS: Record<string, Room> = {
  // one chair, one chair, and the space between them
  "individual-therapy": {
    seats: [
      { x: -0.62, z: 0.1, a: 0, on: 1 },
      { x: 0.62, z: -0.1, a: Math.PI, on: 1 },
    ],
    props: [{ kind: "round", x: 0, z: 0.16, r: 0.22 }],
  },
  // two together, one across — the counsellor is outnumbered on purpose
  "couples-counseling": {
    seats: [
      { x: -0.34, z: 0.5, a: -Math.PI / 2, on: 1 },
      { x: 0.34, z: 0.5, a: -Math.PI / 2, on: 1 },
      { x: 0, z: -0.62, a: Math.PI / 2, on: 1 },
    ],
    props: [{ kind: "round", x: 0, z: 0, r: 0.2 }],
  },
  // a desk, a lamp, and one chair at it
  "student-support": {
    seats: [{ x: 0, z: 0.52, a: -Math.PI / 2, on: 1 }],
    props: [
      { kind: "table", x: 0, z: -0.05, w: 1.25, d: 0.5 },
      { kind: "lamp", x: 0.48, z: -0.12 },
    ],
  },
  // a circle with nothing in the middle
  "group-sessions": {
    seats: ring(6, 0.9),
    props: [{ kind: "rug", x: 0, z: 0, r: 1.16 }],
  },
};

const ORDER = services.map((s) => s.slug).filter((s) => s in ROOMS);

/** Where a chair with no seat in this room waits: folded away at the edge. */
const PARKED: Seat = { x: 0, z: 1.5, a: -Math.PI / 2, on: 0 };

function roomFor(slug: string): Room {
  return ROOMS[slug] ?? ROOMS["individual-therapy"];
}

/** Shortest way round the circle, so a chair never spins the long way. */
function turnToward(from: number, to: number, k: number): number {
  let d = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * k;
}

export default function TheRoom({ className = "" }: { className?: string }) {
  const S = useRef({
    index: 0,
    idle: 0,
    lift: 0,
    /** Live chair state, eased toward the current room every frame. */
    seats: Array.from({ length: CHAIRS }, (): Seat => ({ ...PARKED })),
    /** Seconds since the room last changed — drives the settle. */
    since: 0,
    marks: [] as { x: number; y: number }[],
    hits: [] as { x: number; y: number }[],
    rings: [] as { x: number; y: number; born: number; rgb: RGB }[],
  });

  const goTo = (i: number) => {
    const st = S.current;
    st.index = (i + ORDER.length) % ORDER.length;
    st.idle = 0;
    st.since = 0;
  };

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => {
      const st = S.current;
      for (let i = 0; i < st.marks.length; i++) {
        const m = st.marks[i];
        if (Math.hypot(x - m.x, y - m.y) < 15) {
          goTo(i);
          st.rings.push({
            x: m.x,
            y: m.y,
            born: performance.now(),
            rgb: LOOK[ORDER[i]] ?? PALETTE.gold,
          });
          return;
        }
      }
      // a chair, or anywhere in the room, moves on to the next format
      goTo(st.index + 1);
      st.rings.push({
        x,
        y,
        born: performance.now(),
        rgb: LOOK[ORDER[st.index]] ?? PALETTE.gold,
      });
    },

    draw({ ctx, w, h, t, dt, pointer, reduced, quality }) {
      const st = S.current;
      const now = performance.now();

      // the spread is about 3.1 units across once depth skew is counted
      const unit = Math.min(w * 0.34, h * 0.31);
      const cx = w * 0.5;
      const cy = h * 0.5;

      const project = (x: number, y: number, z: number) => ({
        x: cx + (x + z * DX) * unit,
        y: cy - y * unit + z * DY * unit,
      });

      const slug = ORDER[st.index];
      const rgb = LOOK[slug] ?? PALETTE.gold;
      const room = roomFor(slug);

      /* ── state ─────────────────────────────────────────────────── */

      const over =
        pointer.active &&
        Math.abs(pointer.x - cx) < unit * 1.7 &&
        Math.abs(pointer.y - cy) < unit * 1.2;
      st.lift += ((over ? 1 : 0) - st.lift) * Math.min(1, dt * 5);

      st.idle += dt;
      st.since += dt;
      // hovering slows the room rather than freezing it — a room you are
      // looking at shouldn't rearrange itself out from under you
      if (!reduced && st.idle > SECONDS_PER_ROOM * (1 + st.lift * 1.6)) {
        goTo(st.index + 1);
      }

      // walk each chair toward its place in this room
      const k = Math.min(1, dt * (reduced ? 60 : 3.1));
      for (let i = 0; i < CHAIRS; i++) {
        const want = room.seats[i] ?? PARKED;
        const s = st.seats[i];
        s.x += (want.x - s.x) * k;
        s.z += (want.z - s.z) * k;
        s.a = turnToward(s.a, want.a, k);
        s.on += (want.on - s.on) * Math.min(1, dt * 4);
      }

      /* ── the floor ─────────────────────────────────────────────── */
      {
        const r = 1.34;
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const th = (i / 48) * Math.PI * 2;
          const p = project(Math.cos(th) * r, 0, Math.sin(th) * r);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = rgba(PALETTE.sage, 0.035 + st.lift * 0.025);
        ctx.fill();
        ctx.strokeStyle = rgba(PALETTE.sage, 0.28);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* ── whatever this room is arranged around ─────────────────── */
      const propAlpha = Math.min(1, st.since * 1.6);
      for (const p of room.props) {
        ctx.strokeStyle = rgba(mix(PALETTE.forest, rgb, 0.35), 0.72 * propAlpha);
        ctx.lineWidth = 1.35;

        if (p.kind === "rug") {
          ctx.beginPath();
          for (let i = 0; i <= 48; i++) {
            const th = (i / 48) * Math.PI * 2;
            const q = project(p.x + Math.cos(th) * p.r, 0.005, p.z + Math.sin(th) * p.r);
            if (i === 0) ctx.moveTo(q.x, q.y);
            else ctx.lineTo(q.x, q.y);
          }
          ctx.closePath();
          ctx.setLineDash([5, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
          continue;
        }

        if (p.kind === "lamp") {
          const foot = project(p.x, 0, p.z);
          const neck = project(p.x, 0.46, p.z);
          const shade = project(p.x, 0.52, p.z);
          ctx.beginPath();
          ctx.moveTo(foot.x, foot.y);
          ctx.lineTo(neck.x, neck.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(shade.x - 9, shade.y);
          ctx.lineTo(shade.x + 9, shade.y);
          ctx.lineTo(shade.x + 5, shade.y - 10);
          ctx.lineTo(shade.x - 5, shade.y - 10);
          ctx.closePath();
          ctx.stroke();
          // the one warm light in the room
          const glow = reduced ? 0.6 : Math.sin(t * 1.7) * 0.2 + 0.7;
          ctx.beginPath();
          ctx.fillStyle = rgba(PALETTE.gold, 0.35 * glow * propAlpha);
          ctx.filter = quality.lite ? "none" : "blur(7px)";
          ctx.arc(shade.x, shade.y + 5, 17, 0, Math.PI * 2);
          ctx.fill();
          ctx.filter = "none";
          continue;
        }

        // a table or a desk: a top, and four legs under it
        const hh = p.kind === "round" ? 0.36 : 0.46;
        const corners: [number, number][] =
          p.kind === "round"
            ? []
            : [
                [-p.w / 2, -p.d / 2],
                [p.w / 2, -p.d / 2],
                [p.w / 2, p.d / 2],
                [-p.w / 2, p.d / 2],
              ];

        if (p.kind === "round") {
          ctx.beginPath();
          for (let i = 0; i <= 32; i++) {
            const th = (i / 32) * Math.PI * 2;
            const q = project(p.x + Math.cos(th) * p.r, hh, p.z + Math.sin(th) * p.r);
            if (i === 0) ctx.moveTo(q.x, q.y);
            else ctx.lineTo(q.x, q.y);
          }
          ctx.closePath();
          ctx.fillStyle = rgba(PALETTE.sage, 0.26 * propAlpha);
          ctx.fill();
          ctx.stroke();
          const a = project(p.x, hh, p.z);
          const b = project(p.x, 0, p.z);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          corners.forEach(([dx, dz], i) => {
            const q = project(p.x + dx, hh, p.z + dz);
            if (i === 0) ctx.moveTo(q.x, q.y);
            else ctx.lineTo(q.x, q.y);
          });
          ctx.closePath();
          ctx.fillStyle = rgba(PALETTE.sage, 0.26 * propAlpha);
          ctx.fill();
          ctx.stroke();
          for (const [dx, dz] of corners) {
            const a = project(p.x + dx * 0.92, hh, p.z + dz * 0.86);
            const b = project(p.x + dx * 0.92, 0, p.z + dz * 0.86);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      /* ── the chairs ────────────────────────────────────────────── */
      st.hits = [];
      // far chairs first, so the near ones overlap them correctly
      const order = st.seats
        .map((_, i) => i)
        .sort((a, b) => st.seats[b].z - st.seats[a].z);

      for (const i of order) {
        const s = st.seats[i];
        if (s.on < 0.02) continue;

        const SEAT = 0.3; // half the seat, in floor units
        const H = 0.3; // seat height
        const BACK = 0.34; // how far the back rises above the seat
        const BW = 0.86; // the back is narrower than the seat, like a real one
        const cos = Math.cos(s.a);
        const sin = Math.sin(s.a);
        /** Chair-local (right, forward) → world floor. */
        const P = (r: number, f: number, y: number) =>
          project(s.x + r * cos - f * sin, y, s.z + r * sin + f * cos);

        const seatPts = [
          P(-SEAT, -SEAT, H), P(SEAT, -SEAT, H), P(SEAT, SEAT, H), P(-SEAT, SEAT, H),
        ];
        const centre = project(s.x, H, s.z);
        st.hits.push(centre);

        const near =
          pointer.active && Math.hypot(pointer.x - centre.x, pointer.y - centre.y) < unit * 0.4;
        const glow = s.on * (near ? 1 : 0.55 + st.lift * 0.2);

        // a contact shadow, so the chair stands on the floor instead of over it
        const foot = project(s.x, 0, s.z);
        ctx.save();
        ctx.translate(foot.x, foot.y);
        ctx.scale(1, 0.42);
        ctx.beginPath();
        ctx.fillStyle = rgba(PALETTE.forest, 0.13 * s.on);
        ctx.filter = quality.lite ? "none" : "blur(4px)";
        ctx.arc(0, 0, SEAT * unit * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = "none";
        ctx.restore();

        // seat
        ctx.beginPath();
        seatPts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.fillStyle = rgba(rgb, 0.26 + glow * 0.22);
        ctx.fill();
        ctx.strokeStyle = rgba(mix(rgb, PALETTE.forest, 0.25), 0.8 + glow * 0.2);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // back — rises from the rear edge, which is where the chair faces away
        const backPts = [
          P(-SEAT * BW, -SEAT, H + BACK * 0.18), P(SEAT * BW, -SEAT, H + BACK * 0.18),
          P(SEAT * BW, -SEAT, H + BACK), P(-SEAT * BW, -SEAT, H + BACK),
        ];
        ctx.beginPath();
        backPts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.fillStyle = rgba(rgb, 0.34 + glow * 0.24);
        ctx.fill();
        ctx.stroke();

        // legs
        ctx.beginPath();
        for (const [r, f] of [
          [-SEAT, -SEAT], [SEAT, -SEAT], [SEAT, SEAT], [-SEAT, SEAT],
        ] as const) {
          const a = P(r * 0.86, f * 0.86, H);
          const b = P(r * 0.86, f * 0.86, 0);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.strokeStyle = rgba(rgb, (0.42 + glow * 0.3) * s.on);
        ctx.lineWidth = 1.15;
        ctx.stroke();

        // the node at the top of the back, in the house style
        const top = P(0, -SEAT, H + BACK);
        ctx.beginPath();
        ctx.fillStyle = rgba(mix(rgb, [255, 255, 255], glow * 0.3), 0.7 * s.on + glow * 0.3);
        if (near) {
          ctx.shadowBlur = quality.lite ? 0 : 12;
          ctx.shadowColor = rgba(rgb, 0.9);
        }
        ctx.arc(top.x, top.y, 2.3 + glow * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      /* ── one marker per format, under the floor ────────────────── */
      st.marks = [];
      const spread = unit * 0.34;
      const baseY = cy + unit * 0.95;
      for (let i = 0; i < ORDER.length; i++) {
        const c = LOOK[ORDER[i]] ?? PALETTE.gold;
        const mx = cx + (i - (ORDER.length - 1) / 2) * spread;
        const active = i === st.index;
        const hot = pointer.active && Math.hypot(pointer.x - mx, pointer.y - baseY) < 15;

        ctx.beginPath();
        ctx.fillStyle = rgba(c, active ? 1 : hot ? 0.8 : 0.4);
        if (active) {
          ctx.shadowBlur = quality.lite ? 0 : 10;
          ctx.shadowColor = rgba(c, 0.85);
        }
        ctx.arc(mx, baseY, active ? 4 : 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (active) {
          // a short rule under the live one, the length of the settle
          const p = Math.min(1, st.since / 0.9);
          ctx.beginPath();
          ctx.strokeStyle = rgba(c, 0.5);
          ctx.lineWidth = 1.6;
          ctx.lineCap = "round";
          ctx.moveTo(mx - 9 * p, baseY + 8);
          ctx.lineTo(mx + 9 * p, baseY + 8);
          ctx.stroke();
        }

        st.marks.push({ x: mx, y: baseY });
      }

      /* ── rings where the room was touched ──────────────────────── */
      for (let i = st.rings.length - 1; i >= 0; i--) {
        const age = (now - st.rings[i].born) / 820;
        if (age >= 1) {
          st.rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.strokeStyle = rgba(st.rings[i].rgb, (1 - age) * 0.5);
        ctx.lineWidth = 2 * (1 - age);
        ctx.arc(st.rings[i].x, st.rings[i].y, 6 + age * 46, 0, Math.PI * 2);
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
