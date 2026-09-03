"use client";

import { useRef } from "react";

import { posts } from "@/lib/posts";
import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * The page writing itself, for the blog.
 *
 * One line per published post. A nib travels left to right and nodes land
 * behind it in clusters — words, with gaps between them — so a line of writing
 * appears rather than a line being drawn. When a line finishes it rests and the
 * next one begins, until the whole page is written.
 *
 * Both properties come from `lib/posts.ts`, so the drawing is the archive:
 *
 *   • **line length = read time.** An 8-minute essay writes further than a
 *     5-minute one.
 *   • **colour = category.** Anxiety, Relationships, Student Life, Workplace,
 *     Self-care — from the same muted family as the brain's regions, so the
 *     site keeps one palette.
 *
 * **Click any line and it rewrites itself** from the left, nib and all, with an
 * ink-drop ripple where you touched it.
 *
 * Mechanic is sequenced word-clusters under a moving nib. Nothing here is a
 * graph, a flock, a lattice or an orbit.
 */

type RGB = readonly [number, number, number];

const CATEGORY: Record<string, RGB> = {
  Anxiety: [46, 140, 140], // teal
  Relationships: [197, 106, 114], // rose
  "Student Life": [76, 111, 165], // indigo
  Workplace: [125, 145, 80], // moss
  "Self-care": [200, 164, 93], // gold
};

const FALLBACK: RGB = [122, 107, 168];

/** Minutes from "6 min read"; falls back to a middling length. */
function minutesOf(readTime: string): number {
  const m = /(\d+)/.exec(readTime);
  return m ? Number(m[1]) : 6;
}

type Node = {
  /** Position along the line, 0..1. */
  p: number;
  /** Eased in as the nib passes. */
  ink: number;
  seed: number;
};

type Line = {
  rgb: RGB;
  /** Share of the canvas width this line runs for. */
  reach: number;
  y: number;
  seed: number;
  nodes: Node[];
  /** -1 before it starts; 0..1 while the nib crosses; >1 once written. */
  progress: number;
  /** Seconds to wait before this line begins. */
  wait: number;
  glow: number;
};

/** How long the nib takes to cross a full-width line. */
const WRITE_SECONDS = 1.5;

export default function InkLines({ className = "" }: { className?: string }) {
  const S = useRef({
    lines: (() => {
      const longest = Math.max(...posts.map((p) => minutesOf(p.readTime)));
      return posts.map((post, i): Line => {
        const rgb = CATEGORY[post.category] ?? FALLBACK;
        const reach = 0.46 + 0.5 * (minutesOf(post.readTime) / longest);

        // words: clusters of nodes with gaps, so it reads as text
        const nodes: Node[] = [];
        let cursor = 0.01;
        let w = 0;
        while (cursor < 1) {
          // deterministic word length, so the "sentence" is stable per post
          const letters = 2 + Math.floor((Math.sin(i * 3.1 + w * 1.7) * 0.5 + 0.5) * 4);
          for (let k = 0; k < letters && cursor < 1; k++) {
            nodes.push({ p: cursor, ink: 0, seed: (i * 13 + w * 7 + k) % 97 });
            cursor += 0.022;
          }
          cursor += 0.028; // the space between words
          w++;
        }

        return {
          rgb,
          reach,
          y: (i + 0.9) / (posts.length + 0.8),
          seed: i * 21.7,
          nodes,
          progress: -1,
          wait: i * 0.42,
          glow: 0,
        };
      });
    })(),
    elapsed: 0,
    ripples: [] as { x: number; y: number; born: number; rgb: RGB }[],
  });

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => {
      const st = S.current;
      const h = wrapRef.current?.clientHeight ?? 1;

      let best: Line | null = null;
      let bd = Infinity;
      for (const l of st.lines) {
        const d = Math.abs(l.y * h - y);
        if (d < bd) { bd = d; best = l; }
      }
      if (!best) return;

      // rewrite that line from the start
      best.progress = 0;
      best.wait = 0;
      for (const n of best.nodes) n.ink = 0;
      st.ripples.push({ x, y, born: performance.now(), rgb: best.rgb });
    },

    draw: ({ ctx, w, h, t, dt, pointer, reduced }) => {
      const st = S.current;
      st.elapsed += dt;
      const now = performance.now();

      for (const line of st.lines) {
        const lineY = line.y * h;
        const endX = w * line.reach;

        // hovering a line lifts it slightly
        let near = 0;
        if (pointer.active) {
          const d = Math.abs(pointer.y - lineY);
          if (d < 22) near = 1 - d / 22;
        }
        line.glow += (near - line.glow) * Math.min(1, dt * 6);

        // the nib crosses, then the line rests
        if (reduced) {
          line.progress = 2;
        } else if (line.progress < 0) {
          if (st.elapsed > line.wait) line.progress = 0;
        } else if (line.progress <= 1) {
          line.progress += dt / (WRITE_SECONDS * line.reach);
        }

        // handwriting never sits perfectly flat
        const waver = (p: number) =>
          reduced ? 0 : Math.sin(p * 9 + line.seed) * 1.6 + Math.sin(p * 23 + line.seed * 2) * 0.7;

        // ── the written nodes ──
        for (const n of line.nodes) {
          const want = line.progress > n.p ? 1 : 0;
          n.ink += (want - n.ink) * Math.min(1, dt * (reduced ? 60 : 9));
          if (n.ink < 0.02) continue;

          const x = n.p * endX;
          const breathe = reduced ? 0 : Math.sin(t * 1.3 + n.seed) * 0.35;
          const y = lineY + waver(n.p) + breathe;

          const lit = Math.min(1, line.glow + Math.max(0, 1 - (line.progress - n.p) * 6));
          ctx.beginPath();
          ctx.fillStyle = rgba(
            mix(mix(PALETTE.forest, line.rgb, 0.9), [255, 255, 255], lit * 0.3),
            n.ink * (0.68 + line.glow * 0.32 + lit * 0.2)
          );
          if (lit > 0.4) {
            ctx.shadowBlur = lit * 10;
            ctx.shadowColor = rgba(line.rgb, 0.8);
          }
          ctx.arc(x, y, (2.05 + lit * 1.6) * (0.6 + n.ink * 0.4), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // ── the nib, while this line is being written ──
        if (line.progress >= 0 && line.progress <= 1 && !reduced) {
          const x = line.progress * endX;
          const y = lineY + waver(line.progress);

          // a short wet-ink trail behind the nib
          ctx.beginPath();
          for (let k = 0; k <= 8; k++) {
            const bp = Math.max(0, line.progress - k * 0.012);
            if (k === 0) ctx.moveTo(bp * endX, lineY + waver(bp));
            else ctx.lineTo(bp * endX, lineY + waver(bp));
          }
          ctx.strokeStyle = rgba(line.rgb, 0.4);
          ctx.lineWidth = 1.6;
          ctx.stroke();

          ctx.beginPath();
          ctx.fillStyle = rgba(mix(line.rgb, [255, 255, 255], 0.35), 1);
          ctx.shadowBlur = 14;
          ctx.shadowColor = rgba(line.rgb, 0.9);
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // a faint rule under a finished line, like a ruled page
        if (line.progress > 1) {
          const g = ctx.createLinearGradient(0, 0, endX, 0);
          g.addColorStop(0, rgba(line.rgb, 0));
          g.addColorStop(0.5, rgba(line.rgb, 0.13 + line.glow * 0.18));
          g.addColorStop(1, rgba(line.rgb, 0));
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, lineY + 9);
          ctx.lineTo(endX, lineY + 9);
          ctx.stroke();
        }
      }

      // ── ink drop where the page was touched ──
      for (let i = st.ripples.length - 1; i >= 0; i--) {
        const age = (now - st.ripples[i].born) / 700;
        if (age >= 1) { st.ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.strokeStyle = rgba(st.ripples[i].rgb, (1 - age) * 0.55);
        ctx.lineWidth = 1.8 * (1 - age);
        ctx.arc(st.ripples[i].x, st.ripples[i].y, 4 + age * 34, 0, Math.PI * 2);
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
