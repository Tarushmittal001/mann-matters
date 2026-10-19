"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { sceneQuality } from "@/components/visuals/useCanvasScene";

/**
 * A living neural constellation in the silhouette of a brain.
 *
 * DESIGN NOTE — why there is colour, and why you mostly don't see it.
 *
 * Each region of this brain governs a different feeling, and each now has its
 * own colour. But this thing sits behind the hero headline, so colour is
 * *earned by interaction*, never spent by default:
 *
 *   at rest   — nodes are near-monochrome, tinted only ~20% toward their
 *               region, so the piece reads as calm as a single-colour drawing
 *   on hover  — the region under the cursor blooms into its own colour alone
 *   on click  — a thought travels the network, and the pulse takes on the
 *               colour of each region it arrives in. You watch a thought move
 *               from focus, into feeling, into memory, into calm.
 *
 * That last one is the whole point: the piece argues, without a word of copy,
 * that a mind is many regions with different feelings, all wired together.
 *
 * Drawn on a 2D canvas for crisp glow. Reduced motion stops movement but keeps
 * every colour response — that preference is about vestibular safety, not about
 * being denied feedback.
 */

// Brain silhouette in a 600×560 design space (lateral view, facing left).
const CEREBRUM_D =
  "M150 360 C100 352 66 318 70 268 C58 232 78 192 118 178 C128 138 174 120 212 140 " +
  "C232 110 282 108 304 140 C330 108 376 112 396 144 C440 122 498 142 512 192 " +
  "C548 210 560 262 532 300 C556 326 556 372 520 392 C512 430 470 446 430 432 " +
  "C404 452 360 452 336 430 C300 446 252 446 224 422 C190 432 156 412 150 360 Z";
const CEREBELLUM_D =
  "M430 360 C470 362 506 384 512 420 C516 452 492 478 452 480 C420 480 398 462 392 436 Z";
const STEM_D = "M348 430 C346 466 360 500 386 520 C400 532 404 548 396 558";

type RGB = [number, number, number];

type Node = { x: number; y: number; ph: number; sp: number; ax: number; ay: number; reg: number };
type Edge = { a: number; b: number };
type Pulse = { e: number; t: number; v: number; dir: number; start: number; rgb: RGB; cal?: number };
type Ring = { node: number; born: number; rgb: RGB };

/**
 * Regions, their feeling, and their colour.
 *
 * The palette is deliberately desaturated and mid-value — eight hues that
 * still read as one family on ivory, closer to pigment than to a chart legend.
 * Temporal keeps the brand gold, so memory stays the colour the rest of the
 * site already speaks in.
 */
type Region = {
  name: string;
  emotion: string;
  x: number;
  y: number;
  r: number;
  rgb: RGB;
  /** For the tooltip swatch and the keyboard affordance. */
  hex: string;
};

/**
 * Seven things people arrive with, written around the brain and joined to it
 * by long looping leaders.
 *
 * ── WHY THEY ARE SCATTERED, NOT STACKED ────────────────────────────────────
 * A tidy right-hand column reads like a product diagram. Words thrown to the
 * corners with a line sweeping back into the brain reads like somebody
 * thinking — which is the thing being drawn. The words sit in the gaps the
 * hero reliably leaves at every width: the strip under the nav, and the flank
 * right of the headline. The lower-centre looks empty but is not — the safety
 * notice is a 672×305 panel parked there on every first visit, and a word
 * under it cannot be clicked. Each region colour is used once, which is what
 * stops seven words reading as a pile.
 *
 * ── THE CURVES ─────────────────────────────────────────────────────────────
 * Each leader is a cubic with its control points deliberately *not*
 * symmetrical, so no two bend the same way. `bow` leans the curve out from the
 * straight line between node and word; varying it per callout is what stops
 * four arcs looking like four copies of one arc.
 */
const CALLOUTS: {
  label: string;
  /**
   * The word's own box width, in px — its longest line plus padding.
   *
   * One shared width wasted the difference between the widest label and every
   * other one, and that waste came straight off the brain: the scale below is
   * bound by how far the outermost word reaches. Both lines are `nowrap`, so if
   * a font ever renders wider than the number here the text spills out of its
   * box AWAY from the brain — never onto it.
   */
  w: number;
  /** Title size in rem. Mixed widely on purpose: one uniform size reads as a key. */
  fs: number;
  /**
   * How present the word is, 0–1. Nearer thoughts are clear, further ones
   * faint. Uniform opacity is the other half of what made these read as a
   * legend rather than as things somebody is half-thinking.
   */
  dim: number;
  also: string;
  /** The node being named, in the brain's own 600×560 space. */
  x: number;
  y: number;
  /** Which column the word sits in. */
  side: "l" | "r";
  /**
   * Where the leader meets the word — also in the brain's 600×560 space,
   * picked to sit just clear of the silhouette at that height.
   */
  ax: number;
  ay: number;
  href: string;
  /** Index into REGIONS: the colour, and the region the node actually sits in. */
  reg: number;
}[] = [
  { label: "Anxiety",         w: 130, fs: 1.10, dim: 1.00, also: "worry that won't stop", x: 190, y: 175, side: "l", ax: 112, ay: 142, href: "/services/individual-therapy",    reg: 0 },
  { label: "Low mood",        w: 100, fs: 0.86, dim: 0.72, also: "",                       x: 120, y: 245, side: "l", ax:  54, ay: 236, href: "/services/individual-therapy",    reg: 1 },
  { label: "Exam stress",     w: 106, fs: 0.95, dim: 0.85, also: "the week before",        x: 135, y: 330, side: "l", ax:  61, ay: 322, href: "/services/student-support",       reg: 0 },
  { label: "Career worry",    w:  96, fs: 0.80, dim: 0.62, also: "",                       x: 280, y: 430, side: "l", ax: 164, ay: 442, href: "/services/career-counselling",    reg: 4 },
  { label: "Family pressure", w: 132, fs: 0.95, dim: 0.85, also: "",                       x: 390, y: 185, side: "r", ax: 542, ay: 178, href: "/services/family-therapy",        reg: 2 },
  { label: "Love life",       w: 101, fs: 1.10, dim: 1.00, also: "it keeps hurting",       x: 495, y: 262, side: "r", ax: 560, ay: 268, href: "/services/love-life-counselling", reg: 5 },
  { label: "Burnout",         w:  82, fs: 0.85, dim: 0.70, also: "",                       x: 495, y: 375, side: "r", ax: 562, ay: 366, href: "/services/daily-life-stress",     reg: 6 },
  { label: "Can't sleep",     w:  97, fs: 0.80, dim: 0.62, also: "awake at 2am",           x: 420, y: 470, side: "r", ax: 525, ay: 452, href: "/services/sleep-programme",       reg: 7 },
];

/** Two lines plus padding. Fixed, because text does not scale with the brain. */
const LABEL_H = 40;
/**
 * The vertical middle of the drawn silhouette in design space, from sampling
 * the three paths: the ink runs y 120..560, so its midpoint is 340, not 280.
 */
const INK_MID_Y = 340;

/** Dots per leader. Enough to read as a path, few enough to stay airy. */
const TRAIL_DOTS = 13;
/**
 * Each word's own orbit: amplitude in px, period in seconds, and a negative
 * delay so it starts part-way round. Derived from the index rather than typed
 * out, so the set stays in step with CALLOUTS — but the three cycles (3, 4, 5)
 * are coprime-ish, so no two words share both a period and a phase.
 *
 * `dx` stays small on purpose. Horizontal travel is the axis that eats the
 * measured clearance to the silhouette and to the hero headline; vertical
 * travel costs almost nothing, so the ellipse leans tall.
 */
function orbit(i: number) {
  return {
    dx: 3 + (i % 3) * 0.8,
    dy: 6 + (i % 4) * 0.9,
    dur: 9.5 + (i % 5) * 1.4,
    delay: -(i * 1.9),
  };
}
/** The largest excursion any word can make, for the clearance checks. */
export const ORBIT_MAX = { dx: 4.6, dy: 8.7 };

/** Base gap between aimed signals, plus up to 700ms of jitter. */
const CAL_EVERY = 1500;
/** How long a word stays lit once the signal lands. */
const CAL_DWELL = 1600;

/** The fixed nav overlays the top of this container; words start below it. */
const TOP_SAFE = 94;
const EDGE = 8;

/**
 * How far, in design units, the outermost word reaches from the brain's centre.
 *
 * Derived from the callouts rather than typed in, so adding or moving one
 * cannot leave the scale below stale — which is the failure that used to put a
 * word back on top of the silhouette.
 */
const REACH = CALLOUTS.map((c) => ({
  reach: c.side === "l" ? 300 - c.ax : c.ax - 300,
  w: c.w,
}));

/**
 * How big the brain is drawn.
 *
 * The words have to sit OUTSIDE the silhouette, so the brain is sized to leave
 * room for them. The first version reserved a full label column on each side of
 * the brain's whole 600-wide box, which cost far more than it needed to: the
 * silhouette is only ~480 wide, it narrows sharply towards the top and bottom,
 * and the words were then pinned to the container's edges rather than to the
 * shape — a small brain trailing long leader lines across empty ivory.
 *
 * Now each word has an anchor just outside the silhouette at its own height, so
 * the only thing that must fit is the single widest reach plus one label. The
 * brain gets everything else, and the leaders are short because the words are
 * already next to what they point at.
 */
function brainScale(w: number, h: number) {
  const fits = REACH.map((r) => (w / 2 - r.w - EDGE) / r.reach);
  return Math.max(0.2, Math.min(...fits, (h / 560) * 0.9));
}

/**
 * Where a word actually lands, in container pixels.
 *
 * The anchor rides the brain's own transform, so a word stays welded to its
 * node at every width. The clamps are a backstop for viewports where the
 * container is shorter or narrower than the scale above assumed; without them a
 * top word slid under the fixed nav.
 */
function labelPos(c: (typeof CALLOUTS)[number], view: View) {
  const ax = view.ox + c.ax * view.s;
  const ay = view.oy + c.ay * view.s;
  return {
    left: Math.max(EDGE, Math.min(c.side === "l" ? ax - c.w : ax, view.w - c.w - EDGE)),
    top: Math.max(TOP_SAFE, Math.min(ay - LABEL_H / 2, view.h - LABEL_H - EDGE)),
  };
}

const REGIONS: Region[] = [
  { name: "Frontal lobe", emotion: "Focus, planning & self-control", x: 142, y: 238, r: 112, rgb: [76, 111, 165], hex: "#4C6FA5" },
  { name: "Prefrontal cortex", emotion: "Pausing, reflecting & emotional balance", x: 98, y: 300, r: 86, rgb: [122, 107, 168], hex: "#7A6BA8" },
  { name: "Parietal lobe", emotion: "Awareness & staying present", x: 300, y: 182, r: 112, rgb: [46, 140, 140], hex: "#2E8C8C" },
  { name: "Limbic system", emotion: "The core of joy, fear & love", x: 292, y: 292, r: 84, rgb: [197, 106, 114], hex: "#C56A72" },
  { name: "Temporal lobe", emotion: "Memory, meaning & mood", x: 290, y: 388, r: 110, rgb: [200, 164, 93], hex: "#C8A45D" },
  { name: "Occipital lobe", emotion: "Seeing & making sense of things", x: 480, y: 250, r: 102, rgb: [155, 95, 138], hex: "#9B5F8A" },
  { name: "Cerebellum", emotion: "Balance & steadiness", x: 462, y: 422, r: 82, rgb: [125, 145, 80], hex: "#7D9150" },
  { name: "Brain stem", emotion: "Breath, calm & feeling safe", x: 372, y: 500, r: 88, rgb: [95, 169, 138], hex: "#5FA98A" },
];

/** The quiet base every node sits at before anything happens. */
const FOREST: RGB = [20, 72, 62];

const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Which region owns a point — normalised by radius, so big lobes don't swallow small ones. */
function regionAt(x: number, y: number): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < REGIONS.length; i++) {
    const d = Math.hypot(x - REGIONS[i].x, y - REGIONS[i].y) / REGIONS[i].r;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

type View = { s: number; ox: number; oy: number; w: number; h: number };

export default function NeuralBrain() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  /* One per callout. The canvas loop writes `--f` straight onto these when a
     signal lands, bypassing React: at 60fps, state would re-render the overlay. */
  const labelRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hover, setHover] = useState<Region | null>(null);
  // published so the keyboard affordances can sit exactly over their regions
  const [view, setView] = useState<View | null>(null);
  // lets the keyboard handlers reach into the canvas loop
  const apiRef = useRef<{
    fireRegion: (i: number) => void;
    focusRegion: (i: number | null) => void;
  } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // a phone draws a sparser brain at 30fps: the same picture, half the work
    const quality = sceneQuality();
    const frameGap = 1000 / quality.fps;
    // canvas glow re-blurs the shape on every node, every frame: the one call
    // that turns a smooth phone into a slideshow. Colour carries the effect.
    const glowScale = quality.lite ? 0 : 1;
    const cerebrum = new Path2D(CEREBRUM_D);
    const cerebellum = new Path2D(CEREBELLUM_D);
    const stem = new Path2D(STEM_D);

    // ---- generate nodes inside the silhouette (design space) ----
    const nodes: Node[] = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // a few more than before, so each region carries its colour; fewer on a phone,
    // where the canvas is small enough that the loss doesn't read
    const WANT = Math.round(76 * quality.detail);
    let guard = 0;
    while (nodes.length < WANT && guard < 30000) {
      guard++;
      const x = 55 + Math.random() * 500;
      const y = 110 + Math.random() * 375;
      if (ctx.isPointInPath(cerebrum, x, y) || ctx.isPointInPath(cerebellum, x, y)) {
        if (nodes.every((n) => (n.x - x) ** 2 + (n.y - y) ** 2 > 22 * 22)) {
          nodes.push({
            x, y,
            ph: Math.random() * Math.PI * 2,
            sp: 0.35 + Math.random() * 0.5,
            ax: 2 + Math.random() * 3,
            ay: 2 + Math.random() * 3,
            reg: regionAt(x, y),
          });
        }
      }
    }

    // precomputed colours per node: the hush it rests at, the note it hits
    const restCol: RGB[] = nodes.map((n) => mix(FOREST, REGIONS[n.reg].rgb, 0.2));
    const peakCol: RGB[] = nodes.map((n) => mix(REGIONS[n.reg].rgb, [255, 255, 255], 0.12));

    // ---- wire nearest neighbours ----
    const edges: Edge[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < nodes.length; i++) {
      const near = nodes
        .map((n, j) => ({ j, d: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d);
      let cnt = 0;
      for (const o of near) {
        if (cnt >= 3 || o.d > 96 * 96) break;
        const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ a: i, b: o.j });
        cnt++;
      }
    }

    // adjacency: for each node, its edges (index, neighbour, travel direction)
    const adj: { e: number; other: number; dir: number }[][] = nodes.map(() => []);
    edges.forEach((e, idx) => {
      adj[e.a].push({ e: idx, other: e.b, dir: 1 });
      adj[e.b].push({ e: idx, other: e.a, dir: -1 });
    });

    const pulses: Pulse[] = [];
    const flash = new Float32Array(nodes.length); // 0..1 activation glow per node
    const flashEvents: { t: number; node: number }[] = []; // scheduled activations
    const rings: Ring[] = []; // expanding rings at click origin
    // how "hot" each edge is, so a synapse that just carried a thought keeps a
    // brief afterglow in colour rather than snapping back to grey
    const edgeHeat = new Float32Array(edges.length);

    /*
     * Each callout's nearest real node, and an edge that arrives at it.
     * The words are placed in design space by hand; the nodes are generated,
     * so the two have to be reconciled once here rather than guessed.
     * `dir` is chosen so the pulse's head FINISHES on the callout's node —
     * the light has to arrive, not leave.
     */
    const calNode = CALLOUTS.map((c) => {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const d = (nodes[i].x - c.x) ** 2 + (nodes[i].y - c.y) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    });
    const calEdge = calNode.map((n) => {
      for (let e = 0; e < edges.length; e++) {
        if (edges[e].b === n) return { e, dir: 1 };
        if (edges[e].a === n) return { e, dir: -1 };
      }
      return null;
    });
    const calLit = CALLOUTS.map(() => false); // what we last wrote to the DOM
    const calUntil = CALLOUTS.map(() => 0);   // when each should go dark again
    let calNext = 0;      // whose turn it is
    let calAt = 0;        // when to send the next one
    let screen: { x: number; y: number }[] = []; // latest on-screen node positions
    const pointer = { x: -9999, y: -9999, active: false };

    /**
     * Click ignites a thought: a wave of pulses radiates from the nearest neuron
     * through the network (BFS), lighting each node as it arrives. The pulse
     * takes the colour of the region it is travelling *into* — so a thought
     * crossing from the frontal lobe into the limbic system visibly warms from
     * indigo to rose.
     */
    const fireFrom = (px: number, py: number) => {
      if (!screen.length) return;
      let best = -1;
      let bd = Infinity;
      for (let i = 0; i < screen.length; i++) {
        const d = (screen[i].x - px) ** 2 + (screen[i].y - py) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;
      const now = performance.now();

      // reduced motion: no travelling wave, no expanding ring — just light the
      // region up where it was touched, so the click is still answered
      if (reduce) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].reg === nodes[best].reg) flash[i] = 1;
        }
        return;
      }

      rings.push({ node: best, born: now, rgb: REGIONS[nodes[best].reg].rgb });
      flashEvents.push({ t: now, node: best });
      const WAVE = 120; // ms between expanding rings
      const TRAVEL = 250; // ms a pulse takes to cross an edge
      const visited = new Uint8Array(nodes.length);
      visited[best] = 1;
      let frontier = [best];
      let depth = 0;
      while (frontier.length && depth < 8) {
        const next: number[] = [];
        for (const node of frontier) {
          for (const a of adj[node]) {
            if (visited[a.other]) continue;
            visited[a.other] = 1;
            const spawn = now + depth * WAVE;
            pulses.push({
              e: a.e,
              t: 0,
              v: 1.2,
              dir: a.dir,
              start: spawn,
              rgb: REGIONS[nodes[a.other].reg].rgb,
            });
            flashEvents.push({ t: spawn + TRAVEL, node: a.other });
            next.push(a.other);
          }
        }
        frontier = next;
        depth++;
      }
    };

    // ---- sizing / hi-dpi ----
    let cssW = 0, cssH = 0, dpr = 1, s = 1, ox = 0, oy = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, quality.lite ? 1.5 : 2);
      cssW = wrap.clientWidth;
      cssH = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      s = brainScale(cssW, cssH);
      ox = (cssW - 600 * s) / 2;
      /* Centre the INK, not the box. The silhouette occupies y 120..560 of a
         560-tall design space — 120 units of blank above it and none below —
         so centring the box parked the drawing low and left a band of dead
         ivory under the nav. Horizontal is left alone: the ink is only 8
         units off-centre there, and shifting it would eat the measured
         clearance between the left-hand words and the hero text. */
      oy = cssH / 2 - INK_MID_Y * s;
      setView({ s, ox, oy, w: cssW, h: cssH });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let activeRegion: Region | null = null; // region under cursor or keyboard focus
    let lastHoverName: string | null = null; // so we only setState on change

    const setActive = (reg: Region | null) => {
      activeRegion = reg;
      const name = reg ? reg.name : null;
      if (name !== lastHoverName) {
        lastHoverName = name;
        setHover(reg);
      }
    };

    /** Point the tooltip at a spot in canvas space. */
    const moveTip = (x: number, y: number) => {
      if (tipRef.current) {
        tipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const regionUnder = (cx: number, cy: number): Region | null => {
      const dx = (cx - ox) / s;
      const dy = (cy - oy) / s;
      let best: Region | null = null;
      let bd = Infinity;
      for (const reg of REGIONS) {
        const d = Math.hypot(dx - reg.x, dy - reg.y);
        if (d < bd) { bd = d; best = reg; }
      }
      return best && bd < best.r ? best : null;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
      moveTip(pointer.x, pointer.y);
      setActive(regionUnder(pointer.x, pointer.y));
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
      setActive(null);
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      // touch never sends a hover first, so a tap has to name the region itself
      pointer.x = cx;
      pointer.y = cy;
      pointer.active = true;
      moveTip(cx, cy);
      setActive(regionUnder(cx, cy));
      fireFrom(cx, cy);
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerdown", onDown);

    // the keyboard path into the same behaviour
    apiRef.current = {
      fireRegion: (i) => {
        const reg = REGIONS[i];
        fireFrom(ox + reg.x * s, oy + reg.y * s);
      },
      focusRegion: (i) => {
        if (i === null) {
          pointer.active = false;
          pointer.x = -9999;
          pointer.y = -9999;
          setActive(null);
          return;
        }
        const reg = REGIONS[i];
        const cx = ox + reg.x * s;
        const cy = oy + reg.y * s;
        pointer.x = cx;
        pointer.y = cy;
        pointer.active = true;
        moveTip(cx, cy);
        setActive(reg);
      },
    };

    const start = performance.now();
    let prev = start;
    let lastSpawn = 0;
    let raf = 0;

    let lastPaint = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // hold to the device's target frame rate (30fps on a phone)
      if (now - lastPaint < frameGap - 1) return;
      lastPaint = now;

      const t = (now - start) / 1000;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // apply scheduled activations, then decay every node's flash
      for (let i = flashEvents.length - 1; i >= 0; i--) {
        if (now >= flashEvents[i].t) {
          flash[flashEvents[i].node] = 1;
          flashEvents.splice(i, 1);
        }
      }
      for (let i = 0; i < flash.length; i++) {
        if (flash[i] > 0) flash[i] = Math.max(0, flash[i] - dt * 1.6);
      }
      for (let i = 0; i < edgeHeat.length; i++) {
        if (edgeHeat[i] > 0) edgeHeat[i] = Math.max(0, edgeHeat[i] - dt * 1.1);
      }
      /*
       * Hand the flare to CSS. We write `--f` only on the frame it changes —
       * two writes per word per cycle, not sixty a second — and let the
       * transition on the bar do the easing. Writing every frame would both
       * thrash style recalc and fight that transition.
       */
      for (let i = 0; i < calLit.length; i++) {
        const lit = now < calUntil[i];
        if (lit !== calLit[i]) {
          calLit[i] = lit;
          labelRefs.current[i]?.style.setProperty("--f", lit ? "1" : "0");
        }
      }

      // breathing drift + soft cursor parallax
      const driftX = (reduce ? 0 : Math.sin(t * 0.4) * 6) + (pointer.active && !reduce ? (pointer.x - cssW / 2) * 0.016 : 0);
      const driftY = (reduce ? 0 : Math.cos(t * 0.33) * 6) + (pointer.active && !reduce ? (pointer.y - cssH / 2) * 0.016 : 0);

      // faint filled silhouette + outline, so the shape reads even where sparse
      ctx.save();
      ctx.translate(ox + driftX, oy + driftY);
      ctx.scale(s, s);
      ctx.fillStyle = "rgba(168,195,181,0.07)";
      ctx.fill(cerebrum);
      ctx.fill(cerebellum);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(26,90,77,0.20)";
      ctx.lineWidth = 1.6 / s;
      ctx.stroke(cerebrum);
      ctx.stroke(cerebellum);
      ctx.stroke(stem);
      ctx.restore();

      // node positions: gentle shimmer, plus a light magnetism toward the
      // cursor so the whole web leans in where you point
      const pos = nodes.map((n) => {
        const nx = n.x + (reduce ? 0 : Math.sin(t * n.sp + n.ph) * n.ax);
        const ny = n.y + (reduce ? 0 : Math.cos(t * n.sp * 0.9 + n.ph) * n.ay);
        let px = ox + nx * s + driftX;
        let py = oy + ny * s + driftY;
        if (pointer.active && !reduce) {
          const d = Math.hypot(px - pointer.x, py - pointer.y);
          if (d < 150 && d > 0.001) {
            const k = (1 - d / 150) * 0.16; // subtle — more reads as rubbery
            px += (pointer.x - px) * k;
            py += (pointer.y - py) * k;
          }
        }
        return { x: px, y: py };
      });
      screen = pos;

      // soft halo in the region's own colour
      if (activeRegion) {
        const hx = ox + activeRegion.x * s + driftX;
        const hy = oy + activeRegion.y * s + driftY;
        const hr = activeRegion.r * s * 0.95;
        const grd = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        grd.addColorStop(0, rgba(activeRegion.rgb, 0.22));
        grd.addColorStop(1, rgba(activeRegion.rgb, 0));
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
      }

      // synapses — grey at rest; a lit one takes a gradient between the two
      // regions it joins, so you can see where a connection actually goes
      for (let ei = 0; ei < edges.length; ei++) {
        const e = edges[ei];
        const a = pos[e.a];
        const b = pos[e.b];
        let alpha = 0.15;
        if (pointer.active) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const d = Math.hypot(mx - pointer.x, my - pointer.y);
          if (d < 150) alpha += (1 - d / 150) * 0.4;
        }
        const heat = edgeHeat[ei];
        alpha = Math.min(0.85, alpha + heat * 0.45);

        const ca = REGIONS[nodes[e.a].reg].rgb;
        const cb = REGIONS[nodes[e.b].reg].rgb;
        if (alpha > 0.3) {
          // only build a gradient where it will actually be seen
          const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          const lift = Math.min(1, (alpha - 0.3) / 0.5);
          g.addColorStop(0, rgba(mix([36, 114, 97], ca, lift), alpha));
          g.addColorStop(1, rgba(mix([36, 114, 97], cb, lift), alpha));
          ctx.strokeStyle = g;
          ctx.lineWidth = 1 + heat * 0.7;
        } else {
          ctx.strokeStyle = `rgba(36,114,97,${alpha})`;
          ctx.lineWidth = 1;
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // neurons — every one carries its region's colour, revealed by intensity
      for (let i = 0; i < pos.length; i++) {
        const p = pos[i];
        let r = 2.2;
        let glow = 0;
        if (pointer.active) {
          const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (d < 120) {
            const k = 1 - d / 120;
            r += k * 2.4;
            glow = k;
          }
        }
        // activation from a fired thought
        const f = flash[i];
        if (f > 0.02) {
          r += f * 3.6;
          glow = Math.max(glow, f);
        }
        // brighten neurons inside the named region
        if (activeRegion) {
          const rd = Math.hypot(nodes[i].x - activeRegion.x, nodes[i].y - activeRegion.y);
          if (rd < activeRegion.r * 0.8) {
            const k = 1 - rd / (activeRegion.r * 0.8);
            r += k * 1.8;
            glow = Math.max(glow, k * 0.9);
          }
        }
        const col = mix(restCol[i], peakCol[i], Math.min(1, glow * 1.15));
        ctx.beginPath();
        ctx.fillStyle = rgba(col, 0.82 + glow * 0.18);
        if (glow > 0.02) {
          ctx.shadowBlur = glow * 18 * glowScale;
          ctx.shadowColor = rgba(REGIONS[nodes[i].reg].rgb, 0.85);
        }
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // expanding rings where a thought was sparked, in that region's colour
      for (let i = rings.length - 1; i >= 0; i--) {
        const age = (now - rings[i].born) / 750;
        if (age >= 1) {
          rings.splice(i, 1);
          continue;
        }
        const p = pos[rings[i].node];
        ctx.beginPath();
        ctx.strokeStyle = rgba(rings[i].rgb, (1 - age) * 0.6);
        ctx.lineWidth = 2 * (1 - age);
        ctx.arc(p.x, p.y, 6 + age * 42, 0, Math.PI * 2);
        ctx.stroke();
      }

      // firing synaptic pulses, each with a short comet trail
      if (!reduce) {
        if (now - lastSpawn > 230 && pulses.length < 18 && edges.length) {
          lastSpawn = now;
          const e = (Math.random() * edges.length) | 0;
          const dir = Math.random() < 0.5 ? 1 : -1;
          pulses.push({
            e,
            t: 0,
            v: 0.5 + Math.random() * 0.6,
            dir,
            start: now,
            // an idle pulse also carries the colour of where it's heading
            rgb: REGIONS[nodes[dir > 0 ? edges[e].b : edges[e].a].reg].rgb,
          });
        }
        /*
         * Every so often, aim one pulse at the next word in rotation. This is
         * the whole idea: the words are not on a timer of their own, they are
         * lit by the brain's own traffic arriving at them. Rotation rather
         * than random so no word is left dark for long, with jitter so it
         * never feels metronomic.
         */
        if (now >= calAt) {
          const hit = calEdge[calNext];
          if (hit) {
            pulses.push({
              e: hit.e,
              t: 0,
              v: 0.55,
              dir: hit.dir,
              start: now,
              rgb: REGIONS[CALLOUTS[calNext].reg].rgb,
              cal: calNext,
            });
          }
          calNext = (calNext + 1) % CALLOUTS.length;
          calAt = now + CAL_EVERY + Math.random() * 700;
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
          const pu = pulses[i];
          if (now < pu.start) continue; // cascade pulse still waiting for its turn
          pu.t += pu.v * 0.012;
          if (pu.t >= 1) {
            if (pu.cal !== undefined) {
              calUntil[pu.cal] = now + CAL_DWELL;
              const n = calNode[pu.cal];
              flash[n] = 1; // the node pops as the word lights
            }
            pulses.splice(i, 1);
            continue;
          }
          const e = edges[pu.e];
          edgeHeat[pu.e] = 1;
          const a = pos[e.a];
          const b = pos[e.b];
          const head = pu.dir > 0 ? pu.t : 1 - pu.t;

          // trail: a few shrinking, fading dots behind the head
          for (let k = 3; k >= 1; k--) {
            const back = head - pu.dir * k * 0.055;
            if (back < 0 || back > 1) continue;
            const fade = (1 - k / 4) * 0.5;
            ctx.beginPath();
            ctx.fillStyle = rgba(pu.rgb, fade);
            ctx.arc(
              a.x + (b.x - a.x) * back,
              a.y + (b.y - a.y) * back,
              2.6 * (1 - k / 5),
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          ctx.beginPath();
          ctx.fillStyle = rgba(mix(pu.rgb, [255, 255, 255], 0.25), 1);
          ctx.shadowBlur = 12 * glowScale;
          ctx.shadowColor = rgba(pu.rgb, 0.9);
          ctx.arc(
            a.x + (b.x - a.x) * head,
            a.y + (b.y - a.y) * head,
            2.6,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

    };

    // the loop runs either way: reduced motion silences movement inside the
    // frame, but hover and click still need to be answered — but only while the
    // brain is actually on screen, in a tab someone is looking at
    let running = false;
    const play = () => {
      if (running) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

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
      apiRef.current = null;
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full cursor-pointer" aria-hidden="true" />

      {/*
        The canvas is decorative to assistive tech, so the regions and the
        feelings they name would otherwise be lost entirely. These carry the
        real semantics: tab through the brain, hear each region and its feeling,
        press Enter to fire a thought through it.

        `pointer-events-none` keeps them out of the mouse's way — the canvas
        handles that — while leaving them fully focusable and activatable.
      */}
      {view && (
        <ul className="absolute inset-0 z-20 m-0 list-none p-0">
          {REGIONS.map((reg, i) => {
            const size = reg.r * view.s;
            return (
              <li key={reg.name}>
                <button
                  type="button"
                  className="pointer-events-none absolute rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-800 focus-visible:ring-offset-2"
                  style={{
                    left: view.ox + reg.x * view.s - size / 2,
                    top: view.oy + reg.y * view.s - size / 2,
                    width: size,
                    height: size,
                  }}
                  onFocus={() => apiRef.current?.focusRegion(i)}
                  onBlur={() => apiRef.current?.focusRegion(null)}
                  onClick={() => apiRef.current?.fireRegion(i)}
                >
                  <span className="sr-only">
                    {reg.name} — {reg.emotion}. Activate to send a thought through it.
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/*
        The named concerns. Only from `md` up: below that the brain is ambient
        decoration at 40% opacity *behind* the headline, and labels over it
        would collide with the words rather than annotate anything.

        Positioned with the same `view` transform as the region buttons above,
        so a label stays welded to its node at every width.
      */}
      {view && (
        <div className="pointer-events-none absolute inset-0 z-20 hidden xl:block" aria-hidden="true">
          {/*
            Nothing points at the brain any more.

            There used to be a leader from each word to a coloured dot on
            the silhouette. Softening it from a line to a trail of dots did
            not help, because the leader IS the diagram: a word joined to a
            spot on a specimen is an anatomical figure however it is drawn.
            With the pointers and the dots gone, the words simply sit around
            the brain the way thoughts sit around a mind.
          */}

          {CALLOUTS.map((c, ci) => {
            const reg = REGIONS[c.reg];
            return (
              <a
                key={c.label}
                ref={(el) => {
                  labelRefs.current[ci] = el;
                }}
                href={c.href}
                /* The brain's pointer handlers live on this element's own
                   ancestor (`wrap`), so a press on a word bubbled into them,
                   changed the hovered region, and re-rendered between
                   pointerdown and click — which the browser then never
                   delivered. It failed on roughly one word in seven, and only
                   when the pointer crossed into a different region on the way,
                   which is why it looked like flake. Stopping these here keeps
                   the canvas's own hover and click behaviour untouched. */
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                /* A word on the LEFT is right-aligned and one on the RIGHT is
                   left-aligned — so the text always runs toward the point the
                   line arrives at. Aligned the other way, a short word like
                   "Anxiety" left the leader ending in empty space 90px away,
                   and the line read as floating rather than pointing. */
                className={`brain-drift group pointer-events-auto absolute flex flex-col justify-center rounded-lg px-2 ${
                  c.side === "l" ? "text-right" : "text-left"
                }`}
                style={
                  {
                    ...labelPos(c, view),
                    width: c.w,
                    height: LABEL_H,
                    // how present this thought is; see `dim` on CALLOUTS
                    opacity: c.dim,
                    "--dx": `${orbit(ci).dx}px`,
                    "--dy": `${orbit(ci).dy}px`,
                    animationDuration: `${orbit(ci).dur}s`,
                    animationDelay: `${orbit(ci).delay}s`,
                  } as CSSProperties
                }
              >
                {/* Shrink-wrapped to the word, so the swash behind it is
                    exactly as wide as the word, not as wide as the box. */}
                <span className={`relative ${c.side === "l" ? "self-end" : "self-start"}`}>
                  {/*
                    The flare, as a highlighter stroke. `--f` is written
                    straight onto the anchor by the canvas loop when a signal
                    reaches this word's node, and CSS does the easing. It
                    sweeps from the side the trail arrives on, so the light
                    reads as travelling up the dots and into the word.
                    Alpha stays low: the swash must never pull the text's
                    contrast down, which is why the text itself never dims.
                  */}
                  <span
                    aria-hidden="true"
                    className="absolute -inset-x-[0.3em] -inset-y-[0.12em] rounded-[0.2em]"
                    style={{
                      background: `rgba(${reg.rgb[0]},${reg.rgb[1]},${reg.rgb[2]},0.2)`,
                      transformOrigin: c.side === "l" ? "right" : "left",
                      transform: "scaleX(var(--f, 0))",
                      opacity: "var(--f, 0)",
                      transition:
                        "transform 480ms cubic-bezier(0.22,1,0.36,1), opacity 600ms ease-out",
                    }}
                  />
                  <span
                    className="block whitespace-nowrap font-semibold leading-tight text-forest-900 group-hover:underline group-hover:underline-offset-4"
                    style={{ fontSize: `${c.fs}rem`, textDecorationColor: reg.hex }}
                  >
                    <span className="relative">{c.label}</span>
                  </span>
                </span>
                {/* Only half of them carry one. Term-plus-caption on all eight
                    is what made the set scan as a legend. */}
                {c.also && (
                  <span className="mt-0.5 block whitespace-nowrap text-[0.75rem] leading-tight text-ink/70">
                    {c.also}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}

      {/* tooltip naming the brain part + the feeling it shapes */}
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-0 top-0 z-30"
        style={{ opacity: hover ? 1 : 0, transition: "opacity 150ms ease" }}
        aria-hidden="true"
      >
        {hover && (
          <div className="-translate-x-1/2 -translate-y-[160%] whitespace-nowrap rounded-xl border border-forest-800/10 bg-ivory-light/95 px-4 py-2.5 text-center shadow-bloom backdrop-blur">
            <p className="flex items-center justify-center gap-2 font-display text-sm font-semibold text-forest-900">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: hover.hex }}
              />
              {hover.name}
            </p>
            <p className="mt-0.5 text-xs text-forest-600">{hover.emotion}</p>
          </div>
        )}
      </div>
    </div>
  );
}
