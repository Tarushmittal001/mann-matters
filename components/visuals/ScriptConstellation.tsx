"use client";

import { useRef } from "react";
import { PALETTE, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * "Our care team" — drawn as the languages they speak.
 *
 * One star per practitioner, in that practitioner's own hue (the same hue
 * their card wears below), with a letter from each script they work in held in
 * orbit around it. Two people who share a language are joined by a thread, and
 * every so often that language's letter travels along it — a word passed
 * between colleagues.
 *
 * ── WHY LETTERS, NOT FIGURES ────────────────────────────────────────────────
 * The thing a visitor most needs to know about this team is not what they look
 * like (the real portraits are a scroll below) but whether one of them will
 * understand them in the language they think in. So the picture is that fact
 * and nothing else: every letter is a real language a real person on the list
 * speaks, read from the same `languages` field the filter uses. Add a
 * Konkani-speaking psychologist in admin and a क appears tomorrow.
 *
 * ── INTERACTION ─────────────────────────────────────────────────────────────
 * Hover a letter: everyone who speaks that language brightens and leans in
 * toward each other, the rest step back, and the language is named in its own
 * script. Hover a star: that person's languages light. Click holds the
 * selection; click empty space to let go. Under reduced motion nothing moves —
 * no orbit, no drift, no leaning in, no travelling letters — but the colour
 * still answers the pointer.
 *
 * The canvas is decorative and `aria-hidden`; the language filter in the
 * directory below is the keyboard and screen-reader route to the same answer.
 */

export type ConstellationPerson = {
  /** Hue in degrees, the same value their card uses. */
  hue: number;
  languages: string[];
};

/** A letter that reads as each language at a glance, and its name in its own script. */
const SCRIPT: Record<string, { glyph: string; native: string }> = {
  english: { glyph: "A", native: "English" },
  hindi: { glyph: "ह", native: "हिन्दी" },
  hinglish: { glyph: "हA", native: "Hinglish" },
  marathi: { glyph: "ळ", native: "मराठी" },
  bengali: { glyph: "অ", native: "বাংলা" },
  tamil: { glyph: "த", native: "தமிழ்" },
  telugu: { glyph: "అ", native: "తెలుగు" },
  kannada: { glyph: "ಅ", native: "ಕನ್ನಡ" },
  malayalam: { glyph: "അ", native: "മലയാളം" },
  gujarati: { glyph: "અ", native: "ગુજરાતી" },
  punjabi: { glyph: "ਪ", native: "ਪੰਜਾਬੀ" },
  urdu: { glyph: "ع", native: "اردو" },
  odia: { glyph: "ଓ", native: "ଓଡ଼ିଆ" },
  assamese: { glyph: "ৰ", native: "অসমীয়া" },
  konkani: { glyph: "क", native: "कोंकणी" },
  kashmiri: { glyph: "ک", native: "کٲشُر" },
  maithili: { glyph: "म", native: "मैथिली" },
  bhojpuri: { glyph: "भ", native: "भोजपुरी" },
  rajasthani: { glyph: "र", native: "राजस्थानी" },
  haryanvi: { glyph: "ण", native: "हरियाणवी" },
  tulu: { glyph: "ತ", native: "ತುಳು" },
  sindhi: { glyph: "ڄ", native: "سنڌي" },
  nepali: { glyph: "न", native: "नेपाली" },
  manipuri: { glyph: "ম", native: "মণিপুরী" },
};

function scriptFor(language: string) {
  const known = SCRIPT[language.trim().toLowerCase()];
  if (known) return known;
  // a language added in admin that this table has not met yet still appears,
  // as its own initial, rather than silently dropping out of the picture
  return { glyph: language.trim().charAt(0).toUpperCase() || "·", native: language.trim() };
}

/**
 * A language most of the team speaks (English, and here usually Hindi) gets no
 * threads: tying everyone to everyone says nothing. Threads are for the rarer
 * languages, where "these two both speak Malayalam" is the useful fact.
 */
const COMMON_SHARE = 0.5;

type Star = {
  hue: number;
  /** Rest position as a fraction of the canvas. */
  fx: number;
  fy: number;
  phase: number;
  langs: { key: string; label: string; glyph: string; native: string; angle: number }[];
  /** 0–1, eased: how lit this person is. */
  lit: number;
  /** Eased lean toward the selection's centre, in px. */
  dx: number;
  dy: number;
};

type Thread = { a: number; b: number; key: string; glyph: string; offset: number };

type Hit = { x: number; y: number; r: number; star: number; key: string | null };

const seeded = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export default function ScriptConstellation({
  people,
  className = "",
}: {
  people: ConstellationPerson[];
  className?: string;
}) {
  const state = useRef<{
    stars: Star[];
    threads: Thread[];
    hits: Hit[];
    font: string;
    sans: string;
    hover: { star: number; key: string | null } | null;
    locked: { star: number; key: string | null } | null;
    ripples: { x: number; y: number; age: number; hue: number }[];
    caption: number;
    captionText: { native: string; detail: string; hue: number } | null;
    clock: number;
  }>({
    stars: [],
    threads: [],
    hits: [],
    font: "",
    sans: "",
    hover: null,
    locked: null,
    ripples: [],
    caption: 0,
    captionText: null,
    clock: 0,
  });

  const { wrapRef, canvasRef } = useCanvasScene({
    setup: ({ quality }) => {
      const st = state.current;

      // the site's own faces first (Tiro for Devanagari, Fraunces for Latin),
      // then whatever Indic fonts the device carries for the other scripts
      const root = getComputedStyle(document.documentElement);
      const deva = root.getPropertyValue("--font-deva").trim();
      const display = root.getPropertyValue("--font-display").trim();
      st.font = [deva, display, '"Nirmala UI"', '"Noto Sans"', '"Noto Serif"', "serif"].filter(Boolean).join(", ");
      st.sans = root.getPropertyValue("--font-sans").trim() || "sans-serif";

      if (!people.length) {
        st.stars = [];
        st.threads = [];
        return;
      }

      // a loose cloud weighted to the right, where the canvas is unmasked:
      // golden-angle placement, then a few rounds of pushing apart
      const n = people.length;
      const pts = people.map((_, i) => {
        const r = Math.sqrt((i + 0.5) / n);
        const a = i * 2.39996 + 0.6;
        return { x: 0.68 + Math.cos(a) * r * 0.24, y: 0.5 + Math.sin(a) * r * 0.26 };
      });
      for (let pass = 0; pass < 40; pass++) {
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dx = pts[j].x - pts[i].x;
            const dy = (pts[j].y - pts[i].y) * 0.8;
            const d = Math.hypot(dx, dy) || 0.001;
            const want = 0.26;
            if (d < want) {
              const push = (want - d) * 0.25;
              pts[i].x -= (dx / d) * push;
              pts[i].y -= (dy / d) * push;
              pts[j].x += (dx / d) * push;
              pts[j].y += (dy / d) * push;
            }
          }
        }
        for (const p of pts) {
          // clear of the fixed header above, the hero's copy to the left and
          // the caption strip along the bottom
          p.x = Math.min(0.9, Math.max(0.46, p.x));
          p.y = Math.min(0.74, Math.max(0.27, p.y));
        }
      }

      st.stars = people.map((p, i) => {
        const langs = p.languages.filter(Boolean);
        return {
          hue: p.hue,
          fx: pts[i].x,
          fy: pts[i].y,
          phase: seeded(i) * Math.PI * 2,
          langs: langs.map((label, k) => ({
            key: label.trim().toLowerCase(),
            label: label.trim(),
            ...scriptFor(label),
            angle: (k / Math.max(1, langs.length)) * Math.PI * 2 + seeded(i + 0.37) * Math.PI,
          })),
          lit: 0,
          dx: 0,
          dy: 0,
        };
      });

      const speakers = new Map<string, number>();
      for (const star of st.stars) for (const l of star.langs) speakers.set(l.key, (speakers.get(l.key) ?? 0) + 1);
      const common = (key: string) => key === "english" || (speakers.get(key) ?? 0) > n * COMMON_SHARE;

      const threads: Thread[] = [];
      for (let a = 0; a < n; a++) {
        for (let b = a + 1; b < n; b++) {
          for (const l of st.stars[a].langs) {
            if (common(l.key)) continue;
            if (st.stars[b].langs.some((m) => m.key === l.key)) {
              threads.push({ a, b, key: l.key, glyph: l.glyph, offset: seeded(a * 31 + b * 7 + threads.length) });
            }
          }
        }
      }
      // a phone carries fewer messages rather than the same ones slowly
      st.threads = quality.lite ? threads.slice(0, 6) : threads;
    },

    onPointerDown: () => {
      const st = state.current;
      if (st.hover) {
        const same =
          st.locked && st.locked.star === st.hover.star && st.locked.key === st.hover.key;
        st.locked = same ? null : { ...st.hover };
        const hit = st.hits.find((h) => h.star === st.hover!.star && h.key === st.hover!.key);
        if (hit) st.ripples.push({ x: hit.x, y: hit.y, age: 0, hue: st.stars[hit.star].hue });
      } else {
        st.locked = null;
      }
    },

    draw: ({ ctx, w, h, dt, pointer, reduced }) => {
      const st = state.current;
      if (!st.stars.length) return;
      // our own clock, so reduced motion can stop it outright
      if (!reduced) st.clock += dt;
      const t = st.clock;

      const scale = Math.min(1.15, Math.max(0.7, Math.min(w, h * 1.6) / 620));
      const orbit = 40 * scale;
      const glyphSize = 28 * scale;

      // ── which language (or person) is selected ─────────────────────────────
      let hover: { star: number; key: string | null } | null = null;
      if (pointer.active) {
        let best = Infinity;
        for (const hit of st.hits) {
          const d = Math.hypot(pointer.x - hit.x, pointer.y - hit.y);
          if (d < hit.r && d < best) {
            best = d;
            hover = { star: hit.star, key: hit.key };
          }
        }
      }
      st.hover = hover;
      const sel = hover ?? st.locked;

      const speaks = (s: Star, i: number) =>
        !sel ? false : sel.key ? s.langs.some((l) => l.key === sel.key) : i === sel.star;

      // ── rest positions, eased lean toward the selection ────────────────────
      const base = st.stars.map((s) => ({
        x: s.fx * w + (reduced ? 0 : Math.sin(t * 0.35 + s.phase) * 5 * scale),
        y: s.fy * h + (reduced ? 0 : Math.cos(t * 0.28 + s.phase * 1.3) * 6 * scale),
      }));
      let cx = 0;
      let cy = 0;
      let count = 0;
      st.stars.forEach((s, i) => {
        if (speaks(s, i)) {
          cx += base[i].x;
          cy += base[i].y;
          count++;
        }
      });
      if (count) {
        cx /= count;
        cy /= count;
      }
      const ease = Math.min(1, dt * 5);
      const pos = st.stars.map((s, i) => {
        const on = sel ? speaks(s, i) : false;
        s.lit += ((sel ? (on ? 1 : -0.6) : 0) - s.lit) * ease;
        // the people who share it lean in; nobody moves for reduced motion
        const tx = on && count > 1 && sel?.key && !reduced ? (cx - base[i].x) * 0.16 : 0;
        const ty = on && count > 1 && sel?.key && !reduced ? (cy - base[i].y) * 0.16 : 0;
        s.dx += (tx - s.dx) * ease;
        s.dy += (ty - s.dy) * ease;
        return { x: base[i].x + s.dx, y: base[i].y + s.dy };
      });

      const ink = (hue: number, l: number, a: number) => `hsl(${hue} 40% ${l}% / ${a})`;
      const fade = (s: Star) => (s.lit < 0 ? 1 + s.lit * 0.9 : 1); // 1 → ~0.46 when stepped back

      // ── threads between people who share a language ────────────────────────
      ctx.lineCap = "round";
      for (const th of st.threads) {
        const A = pos[th.a];
        const B = pos[th.b];
        const sa = st.stars[th.a];
        const sb = st.stars[th.b];
        const active = sel?.key === th.key;
        const quiet = sel && !active;
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2 - Math.hypot(B.x - A.x, B.y - A.y) * 0.2;

        const grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
        const alpha = active ? 0.6 : quiet ? 0.05 : 0.22;
        grad.addColorStop(0, ink(sa.hue, 45, alpha));
        grad.addColorStop(1, ink(sb.hue, 45, alpha));
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.quadraticCurveTo(mx, my, B.x, B.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = active ? 1.6 : 1;
        ctx.stroke();

        // the word passed along it: a slow crossing, a long rest, then back
        if (!reduced && (!sel || active)) {
          const period = 9;
          const p = ((t / period + th.offset) % 1) * 2; // 0–1 one way, 1–2 back
          const u = (p % 1) / 0.55; // crossing takes the first 55% of each leg, then a rest
          if (u < 1) {
            const k = p < 1 ? u : 1 - u;
            const x = (1 - k) * (1 - k) * A.x + 2 * (1 - k) * k * mx + k * k * B.x;
            const y = (1 - k) * (1 - k) * A.y + 2 * (1 - k) * k * my + k * k * B.y;
            const env = Math.sin(u * Math.PI);
            const hue = sa.hue + (sb.hue - sa.hue) * k;
            ctx.font = `${glyphSize * 0.7}px ${st.font}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = ink(hue, 36, (active ? 0.9 : 0.55) * env);
            ctx.fillText(th.glyph, x, y);
          }
        }
      }

      // ── stars and their orbiting letters ───────────────────────────────────
      const hits: Hit[] = [];
      st.stars.forEach((s, i) => {
        const p = pos[i];
        const f = fade(s);
        const lit = Math.max(0, s.lit);

        // a soft halo for whoever is selected
        if (lit > 0.02) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, orbit * 1.9);
          halo.addColorStop(0, ink(s.hue, 60, 0.18 * lit));
          halo.addColorStop(1, ink(s.hue, 60, 0));
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, orbit * 1.9, 0, Math.PI * 2);
          ctx.fill();
        }

        // the orbit itself, barely there
        ctx.beginPath();
        ctx.arc(p.x, p.y, orbit, 0, Math.PI * 2);
        ctx.strokeStyle = ink(s.hue, 45, (0.12 + lit * 0.18) * f);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // the person
        ctx.beginPath();
        ctx.arc(p.x, p.y, (4.2 + lit * 1.6) * scale, 0, Math.PI * 2);
        ctx.fillStyle = ink(s.hue, 40, 0.85 * f);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, (8 + lit * 3) * scale, 0, Math.PI * 2);
        ctx.strokeStyle = ink(s.hue, 45, 0.35 * f);
        ctx.stroke();
        hits.push({ x: p.x, y: p.y, r: 14 * scale, star: i, key: null });

        // their languages, turning slowly around them
        const spin = reduced ? 0 : t * 0.06 * (i % 2 ? 1 : -1);
        for (const l of s.langs) {
          const a = l.angle + spin;
          const gx = p.x + Math.cos(a) * orbit;
          const gy = p.y + Math.sin(a) * orbit;
          const chosen = sel?.key === l.key;
          const size = glyphSize * (l.glyph.length > 1 ? 0.72 : 1) * (chosen ? 1.25 : 1);
          ctx.font = `${size}px ${st.font}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // a ground-coloured knock-out so the dashed orbit never runs through a letter
          ctx.beginPath();
          ctx.arc(gx, gy, size * 0.62, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(247,244,238,0.9)";
          ctx.fill();
          ctx.fillStyle = ink(s.hue, chosen ? 30 : 36, (chosen ? 1 : 0.78) * f);
          ctx.fillText(l.glyph, gx, gy + size * 0.04);
          hits.push({ x: gx, y: gy, r: Math.max(16, size * 0.85), star: i, key: l.key });
        }
      });
      st.hits = hits;

      // ── ripples from a click ───────────────────────────────────────────────
      st.ripples = st.ripples.filter((r) => r.age < 1);
      for (const r of st.ripples) {
        r.age += dt * (reduced ? 3 : 1.1);
        const rad = reduced ? glyphSize : glyphSize + r.age * 70 * scale;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.strokeStyle = ink(r.hue, 40, 0.5 * (1 - r.age));
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // ── the caption: the language, named in its own script ─────────────────
      if (sel) {
        const s = st.stars[sel.star];
        if (sel.key) {
          const lang = s.langs.find((l) => l.key === sel.key);
          if (lang) {
            st.captionText = {
              native: lang.native,
              detail:
                lang.native === lang.label
                  ? `${count} of ${st.stars.length} on the team`
                  : `${lang.label} · ${count} of ${st.stars.length} on the team`,
              hue: s.hue,
            };
          }
        } else {
          st.captionText = {
            native: s.langs.map((l) => l.native).join("  ·  "),
            detail: `One person, ${s.langs.length} ${s.langs.length === 1 ? "language" : "languages"}`,
            hue: s.hue,
          };
        }
      }
      st.caption += ((sel ? 1 : 0) - st.caption) * Math.min(1, dt * 6);
      if (st.caption > 0.02 && st.captionText) {
        const c = st.captionText;
        const x = w * 0.9;
        const y = h * 0.95;
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        ctx.lineJoin = "round";
        // a paper-coloured outline, so a letter drifting behind never cuts through the words
        ctx.strokeStyle = `rgba(247,244,238,${0.95 * st.caption})`;
        ctx.lineWidth = 6;
        ctx.font = `${34 * scale}px ${st.font}`;
        ctx.strokeText(c.native, x, y - 22 * scale, w * 0.6);
        ctx.fillStyle = ink(c.hue, 32, st.caption);
        ctx.fillText(c.native, x, y - 22 * scale, w * 0.6);
        ctx.font = `600 ${11 * scale}px ${st.sans}`;
        ctx.strokeText(c.detail.toUpperCase(), x, y);
        ctx.fillStyle = rgba(PALETTE.ink, 0.65 * st.caption);
        ctx.fillText(c.detail.toUpperCase(), x, y);
      }
    },
  });

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full cursor-default" aria-hidden="true" />
    </div>
  );
}
