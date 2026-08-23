"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A living neural constellation in the silhouette of a brain. Soft sage nodes
 * are wired by faint synapses; gold pulses travel the connections like thoughts
 * firing. It breathes, leans toward the cursor, and lights up where you point.
 * Drawn on a 2D canvas for crisp glow and smooth motion. Respects reduced motion.
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

type Node = { x: number; y: number; ph: number; sp: number; ax: number; ay: number };
type Edge = { a: number; b: number };
type Pulse = { e: number; t: number; v: number; dir: number; start: number };
type Ring = { node: number; born: number };

// Brain regions (in design space) with the feelings they help govern. Hovering
// the constellation names the part you're over and the emotion it shapes.
type Region = { name: string; emotion: string; x: number; y: number; r: number };
const REGIONS: Region[] = [
  { name: "Frontal lobe", emotion: "Focus, planning & self-control", x: 142, y: 238, r: 112 },
  { name: "Prefrontal cortex", emotion: "Pausing, reflecting & emotional balance", x: 98, y: 300, r: 86 },
  { name: "Parietal lobe", emotion: "Awareness & staying present", x: 300, y: 182, r: 112 },
  { name: "Limbic system", emotion: "The core of joy, fear & love", x: 292, y: 292, r: 84 },
  { name: "Temporal lobe", emotion: "Memory, meaning & mood", x: 290, y: 388, r: 110 },
  { name: "Occipital lobe", emotion: "Seeing & making sense of things", x: 480, y: 250, r: 102 },
  { name: "Cerebellum", emotion: "Balance & steadiness", x: 462, y: 422, r: 82 },
  { name: "Brain stem", emotion: "Breath, calm & feeling safe", x: 372, y: 500, r: 88 },
];

export default function NeuralBrain() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Region | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cerebrum = new Path2D(CEREBRUM_D);
    const cerebellum = new Path2D(CEREBELLUM_D);
    const stem = new Path2D(STEM_D);

    // ---- generate nodes inside the silhouette (design space) ----
    const nodes: Node[] = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const WANT = 64;
    let guard = 0;
    while (nodes.length < WANT && guard < 30000) {
      guard++;
      const x = 55 + Math.random() * 500;
      const y = 110 + Math.random() * 375;
      if (ctx.isPointInPath(cerebrum, x, y) || ctx.isPointInPath(cerebellum, x, y)) {
        if (nodes.every((n) => (n.x - x) ** 2 + (n.y - y) ** 2 > 24 * 24)) {
          nodes.push({
            x, y,
            ph: Math.random() * Math.PI * 2,
            sp: 0.35 + Math.random() * 0.5,
            ax: 2 + Math.random() * 3,
            ay: 2 + Math.random() * 3,
          });
        }
      }
    }

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
    let screen: { x: number; y: number }[] = []; // latest on-screen node positions
    const pointer = { x: -9999, y: -9999, active: false };

    // Click ignites a thought: a wave of pulses radiates out from the nearest
    // neuron through the network, lighting each node as it arrives (BFS).
    const fireFrom = (px: number, py: number) => {
      if (reduce || !screen.length) return;
      let best = -1;
      let bd = Infinity;
      for (let i = 0; i < screen.length; i++) {
        const d = (screen[i].x - px) ** 2 + (screen[i].y - py) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;
      const now = performance.now();
      rings.push({ node: best, born: now });
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
            pulses.push({ e: a.e, t: 0, v: 1.2, dir: a.dir, start: spawn });
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
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = wrap.clientWidth;
      cssH = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      s = Math.min(cssW / 600, cssH / 560) * 0.96;
      ox = (cssW - 600 * s) / 2;
      oy = (cssH - 560 * s) / 2;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let activeRegion: Region | null = null; // region under the cursor (for the halo)
    let lastHoverName: string | null = null; // so we only setState on change

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;

      // the tooltip trails the cursor
      if (tipRef.current) {
        tipRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      }

      // which brain region are we over? (convert cursor → design space)
      const dx = (pointer.x - ox) / s;
      const dy = (pointer.y - oy) / s;
      let best: Region | null = null;
      let bd = Infinity;
      for (const reg of REGIONS) {
        const d = Math.hypot(dx - reg.x, dy - reg.y);
        if (d < bd) { bd = d; best = reg; }
      }
      const within = best && bd < best.r ? best : null;
      activeRegion = within;
      const name = within ? within.name : null;
      if (name !== lastHoverName) {
        lastHoverName = name;
        setHover(within);
      }
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
      activeRegion = null;
      if (lastHoverName !== null) {
        lastHoverName = null;
        setHover(null);
      }
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      fireFrom(e.clientX - r.left, e.clientY - r.top);
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerdown", onDown);

    const start = performance.now();
    let prev = start;
    let lastSpawn = 0;
    let raf = 0;

    const frame = (now: number) => {
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

      // breathing drift + soft cursor parallax
      const driftX = (reduce ? 0 : Math.sin(t * 0.4) * 6) + (pointer.active ? (pointer.x - cssW / 2) * 0.016 : 0);
      const driftY = (reduce ? 0 : Math.cos(t * 0.33) * 6) + (pointer.active ? (pointer.y - cssH / 2) * 0.016 : 0);

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

      // node positions (with gentle per-node shimmer)
      const pos = nodes.map((n) => {
        const nx = n.x + (reduce ? 0 : Math.sin(t * n.sp + n.ph) * n.ax);
        const ny = n.y + (reduce ? 0 : Math.cos(t * n.sp * 0.9 + n.ph) * n.ay);
        return { x: ox + nx * s + driftX, y: oy + ny * s + driftY };
      });
      screen = pos;

      // soft halo over the brain region the cursor is naming
      if (activeRegion) {
        const hx = ox + activeRegion.x * s + driftX;
        const hy = oy + activeRegion.y * s + driftY;
        const hr = activeRegion.r * s * 0.95;
        const grd = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        grd.addColorStop(0, "rgba(200,164,93,0.20)");
        grd.addColorStop(1, "rgba(200,164,93,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
      }

      // synapses
      for (const e of edges) {
        const a = pos[e.a];
        const b = pos[e.b];
        let alpha = 0.15;
        if (pointer.active) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const d = Math.hypot(mx - pointer.x, my - pointer.y);
          if (d < 150) alpha += (1 - d / 150) * 0.4;
        }
        ctx.strokeStyle = `rgba(36,114,97,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // neurons
      for (let i = 0; i < pos.length; i++) {
        const p = pos[i];
        let r = 2.2;
        let glow = 0;
        let gold = false;
        if (pointer.active) {
          const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (d < 120) {
            const k = 1 - d / 120;
            r += k * 2.4;
            glow = k;
            gold = k > 0.55;
          }
        }
        // activation from a fired thought
        const f = flash[i];
        if (f > 0.02) {
          r += f * 3.6;
          glow = Math.max(glow, f);
          gold = gold || f > 0.35;
        }
        // brighten neurons inside the named region
        if (activeRegion) {
          const rd = Math.hypot(nodes[i].x - activeRegion.x, nodes[i].y - activeRegion.y);
          if (rd < activeRegion.r * 0.8) {
            const k = 1 - rd / (activeRegion.r * 0.8);
            r += k * 1.8;
            glow = Math.max(glow, k * 0.9);
            gold = true;
          }
        }
        ctx.beginPath();
        ctx.fillStyle = gold ? "#C8A45D" : "rgba(20,72,62,0.82)";
        ctx.shadowBlur = glow * 16;
        ctx.shadowColor = gold ? "rgba(200,164,93,0.85)" : "rgba(168,195,181,0.6)";
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // expanding rings where a thought was sparked
      for (let i = rings.length - 1; i >= 0; i--) {
        const age = (now - rings[i].born) / 750;
        if (age >= 1) {
          rings.splice(i, 1);
          continue;
        }
        const p = pos[rings[i].node];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(200,164,93,${(1 - age) * 0.55})`;
        ctx.lineWidth = 2 * (1 - age);
        ctx.arc(p.x, p.y, 6 + age * 42, 0, Math.PI * 2);
        ctx.stroke();
      }

      // firing synaptic pulses
      if (!reduce) {
        if (now - lastSpawn > 230 && pulses.length < 18 && edges.length) {
          lastSpawn = now;
          pulses.push({ e: (Math.random() * edges.length) | 0, t: 0, v: 0.5 + Math.random() * 0.6, dir: Math.random() < 0.5 ? 1 : -1, start: now });
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const pu = pulses[i];
          if (now < pu.start) continue; // cascade pulse still waiting for its turn
          pu.t += pu.v * 0.012;
          if (pu.t >= 1) {
            pulses.splice(i, 1);
            continue;
          }
          const e = edges[pu.e];
          const a = pos[e.a];
          const b = pos[e.b];
          const tt = pu.dir > 0 ? pu.t : 1 - pu.t;
          const x = a.x + (b.x - a.x) * tt;
          const y = a.y + (b.y - a.y) * tt;
          ctx.beginPath();
          ctx.fillStyle = "#D8B468";
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(200,164,93,0.9)";
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    if (reduce) {
      frame(performance.now());
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full cursor-pointer" aria-hidden="true" />
      {/* tooltip naming the brain part + the feeling it shapes */}
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-0 top-0 z-30"
        style={{ opacity: hover ? 1 : 0, transition: "opacity 150ms ease" }}
        aria-hidden="true"
      >
        {hover && (
          <div className="-translate-x-1/2 -translate-y-[160%] whitespace-nowrap rounded-xl border border-forest-800/10 bg-ivory-light/95 px-4 py-2.5 text-center shadow-bloom backdrop-blur">
            <p className="font-display text-sm font-semibold text-forest-900">{hover.name}</p>
            <p className="mt-0.5 text-xs text-forest-600">{hover.emotion}</p>
          </div>
        )}
      </div>
    </div>
  );
}
