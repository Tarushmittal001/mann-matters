import { readFile, writeFile } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Turning what was changed in the browser into a change in the source.
 *
 * Used only by `app/api/dev/size-lab/route.ts`, which is development-only.
 *
 * ── THE HARD PART IS NOT WRITING THE FILE ──────────────────────────────────
 * It is knowing WHICH file, and being honest when it cannot be known. The
 * browser hands over a rendered element; the source is JSX that produced it,
 * possibly inside a `.map()`, possibly with its classes assembled at runtime.
 * So every rule here is the same shape: find exactly one place that can be
 * the source of this element, or refuse and say why.
 *
 * **It never guesses.** Two candidate lines is a refusal, not a coin toss.
 * Everything applied is an exact string replacement, recorded in the result
 * and in `design-changes.jsonl`, so `git diff` shows it and `git checkout`
 * undoes it.
 *
 * ── WHAT THE BROWSER CANNOT SEE ────────────────────────────────────────────
 * One source line can render many elements. The eight concern cards share one
 * `className` inside one `.map()`: narrowing one narrows all eight, because
 * there is one place in the code to change. `siblings` carries the count from
 * the browser so the result can say so rather than surprising anyone.
 */

const ROOTS = ["app", "components", "lib"];
const CODE = /\.tsx?$/;

export type DesignChange = {
  tag: string;
  className: string;
  text: string;
  path: string;
  props: Record<string, { from: string; to: string }>;
  removed: boolean;
  textChange?: { from: string; to: string };
  /** how many elements on the page shared this exact className */
  siblings?: number;
};

export type Result = {
  ok: boolean;
  what: string;
  file?: string;
  detail: string;
  edits?: { before: string; after: string }[];
};

/* ── finding the source ──────────────────────────────────────────────────── */

type Hit = { file: string; text: string; index: number };

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e === "node_modules" || e === ".next" || e === "dev") continue;
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (CODE.test(e)) out.push(full);
    }
  };
  for (const r of ROOTS) walk(join(process.cwd(), r));
  return out;
}

/** Every file containing `needle`, with the file's text, read once. */
async function find(needle: string): Promise<Hit[]> {
  if (!needle.trim()) return [];
  const hits: Hit[] = [];
  for (const file of sourceFiles()) {
    const text = await readFile(file, "utf8");
    let i = text.indexOf(needle);
    while (i !== -1) {
      hits.push({ file, text, index: i });
      i = text.indexOf(needle, i + 1);
      if (hits.length > 8) return hits; // ambiguous enough already
    }
  }
  return hits;
}

const rel = (f: string) => relative(process.cwd(), f).replace(/\\/g, "/");

/* ── px → Tailwind ───────────────────────────────────────────────────────── */

/** Tailwind's spacing scale, in px at a 16px root. */
const SPACING: [string, number][] = [
  ["0", 0], ["px", 1], ["0.5", 2], ["1", 4], ["1.5", 6], ["2", 8], ["2.5", 10],
  ["3", 12], ["3.5", 14], ["4", 16], ["5", 20], ["6", 24], ["7", 28], ["8", 32],
  ["9", 36], ["10", 40], ["11", 44], ["12", 48], ["14", 56], ["16", 64],
  ["20", 80], ["24", 96], ["28", 112], ["32", 128], ["36", 144], ["40", 160],
];

const RADIUS: [string, number][] = [
  ["-none", 0], ["-sm", 2], ["", 4], ["-md", 6], ["-lg", 8], ["-xl", 12],
  ["-2xl", 16], ["-3xl", 24], ["-full", 9999],
];

const FONT: [string, number][] = [
  ["xs", 12], ["sm", 14], ["base", 16], ["lg", 18], ["xl", 20], ["2xl", 24],
  ["3xl", 30], ["4xl", 36], ["5xl", 48], ["6xl", 60], ["7xl", 72],
];

/** The named step if one lands within half a pixel, else an arbitrary value. */
function pick(scale: [string, number][], px: number, prefix: string, join = "-"): string {
  for (const [name, v] of scale) {
    if (Math.abs(v - px) < 0.5) return name === "" ? prefix : `${prefix}${join}${name}`;
  }
  const n = Math.round(px * 10) / 10;
  return `${prefix}-[${n}px]`;
}

/** Which CSS properties map to which Tailwind prefix, and on which scale. */
const UTILITY: Record<string, { prefix: string; scale: [string, number][]; join?: string }> = {
  fontSize: { prefix: "text", scale: FONT },
  paddingTop: { prefix: "p", scale: SPACING },
  rowGap: { prefix: "gap", scale: SPACING },
  marginTop: { prefix: "m", scale: SPACING },
  width: { prefix: "w", scale: [] },
  height: { prefix: "h", scale: [] },
  borderRadius: { prefix: "rounded", scale: RADIUS, join: "" },
  lineHeight: { prefix: "leading", scale: [] },
  letterSpacing: { prefix: "tracking", scale: [] },
};

/** paddingRight and friends are folded into their one-letter utility. */
const FOLD: Record<string, string> = {
  paddingRight: "paddingTop", paddingBottom: "paddingTop", paddingLeft: "paddingTop",
  marginRight: "marginTop", marginBottom: "marginTop", marginLeft: "marginTop",
  columnGap: "rowGap",
};

/* ── rewriting a className ───────────────────────────────────────────────── */

/** Tailwind's breakpoints, for working out which class was actually winning. */
const BREAKPOINTS: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 };

/**
 * Swap a utility inside a class string, editing the one that was ACTUALLY
 * WINNING at the width the change was judged at.
 *
 * This is the whole difficulty. A card reading `p-5 sm:p-6` shows 24px on a
 * desktop, because `sm:p-6` applies from 640px up. Stepping it down to 20px
 * and rewriting the bare `p-5` produces `p-5` again — a no-op — while the
 * thing on screen never moves. The first version did exactly that, and
 * reported "nothing mapped to a Tailwind utility" for a change that was real.
 *
 * So: among the classes for this utility, take the bare one and every
 * breakpoint variant whose min-width is <= the viewport, and edit the one
 * with the largest min-width, which is the one CSS is using. Variants ABOVE
 * the viewport are left alone and reported — they are a decision made for a
 * width nobody was looking at.
 *
 * State variants (`hover:`, `focus-visible:`) are never candidates.
 */
function setUtility(
  classes: string,
  prefix: string,
  next: string,
  viewport: number
): { out: string; note?: string } {
  const parts = classes.split(/\s+/).filter(Boolean);
  /* No regex: building one from a prefix means escaping `[` for the
     arbitrary-value form, and getting that wrong yields
     "Unterminated character class" at runtime rather than at build. */
  const isUtil = (u: string) =>
    u === prefix || u.indexOf(prefix + "-") === 0 || u.indexOf(prefix + "[") === 0;

  let bestAt = -1;
  let bestIndex = -1;
  const above: string[] = [];

  parts.forEach((p, i) => {
    const colon = p.lastIndexOf(":");
    const variant = colon === -1 ? "" : p.slice(0, colon);
    const util = colon === -1 ? p : p.slice(colon + 1);
    if (!isUtil(util)) return;
    if (variant && !(variant in BREAKPOINTS)) return;
    const at = variant ? BREAKPOINTS[variant] : 0;
    if (at > viewport) {
      above.push(p);
      return;
    }
    if (at > bestAt) {
      bestAt = at;
      bestIndex = i;
    }
  });

  const out = parts.slice();
  if (bestIndex === -1) {
    out.push(next);
  } else {
    const winner = parts[bestIndex];
    const colon = winner.lastIndexOf(":");
    out[bestIndex] = colon === -1 ? next : winner.slice(0, colon) + ":" + next;
  }

  const note = above.length
    ? above.join(", ") + " still applies above that width — left alone on purpose"
    : undefined;
  return { out: out.join(" "), note };
}

/* ── the three kinds of change ───────────────────────────────────────────── */

async function applyText(c: DesignChange): Promise<Result> {
  const { from, to } = c.textChange!;
  const what = `text "${from.slice(0, 40)}" → "${to.slice(0, 40)}"`;
  const hits = await find(from);

  if (hits.length === 0) {
    return { ok: false, what, detail: "that text is not in the source as written — it may be built at runtime" };
  }
  if (hits.length > 1) {
    const where = hits.map((h) => rel(h.file));
    const unique = where.filter((f, i) => where.indexOf(f) === i);
    return { ok: false, what, detail: `appears ${hits.length} times (${unique.join(", ")}) — too ambiguous to change safely` };
  }

  const h = hits[0];
  const next = h.text.slice(0, h.index) + to + h.text.slice(h.index + from.length);
  await writeFile(h.file, next, "utf8");
  return { ok: true, what, file: rel(h.file), detail: "replaced", edits: [{ before: from, after: to }] };
}

async function applyProps(c: DesignChange, viewport: number): Promise<Result> {
  const names = Object.keys(c.props);
  const what = `${names.length} size change${names.length > 1 ? "s" : ""} on <${c.tag}>`;

  if (!c.className.trim()) {
    return { ok: false, what, detail: "the element has no class attribute to change" };
  }
  const hits = await find(`"${c.className}"`);
  if (hits.length === 0) {
    return { ok: false, what, detail: "its class string is not a literal in the source — likely assembled with cn() or a template string" };
  }
  if (hits.length > 1) {
    return { ok: false, what, detail: `that exact class string appears ${hits.length} times — too ambiguous to change safely` };
  }

  let classes = c.className;
  const notes: string[] = [];
  const done: string[] = [];

  for (const [name, { to }] of Object.entries(c.props)) {
    const key = FOLD[name] ?? name;
    if (done.indexOf(key) > -1) continue; // paddingRight after paddingTop
    const u = UTILITY[key];
    if (!u) continue;
    done.push(key);
    const px = parseFloat(to) || 0;
    const cls = pick(u.scale, px, u.prefix, u.join);
    const { out, note } = setUtility(classes, u.prefix, cls, viewport);
    classes = out;
    if (note) notes.push(note);
  }

  if (classes === c.className) {
    return {
      ok: false,
      what,
      detail:
        "the classes already say that — the rendered size comes from somewhere else (a parent, or CSS outside the class list)",
    };
  }

  const h = hits[0];
  const before = `"${c.className}"`;
  const after = `"${classes}"`;
  await writeFile(h.file, h.text.slice(0, h.index) + after + h.text.slice(h.index + before.length), "utf8");

  const many = (c.siblings ?? 1) > 1 ? ` — note: one source line, ${c.siblings} elements on the page` : "";
  return {
    ok: true,
    what,
    file: rel(h.file),
    detail: (notes.length ? notes.join("; ") : "classes rewritten") + many,
    edits: [{ before, after }],
  };
}

/**
 * Deleting is the one that can quietly destroy work, so it is the strictest.
 *
 * It only handles the case it can be sure of: a one-line entry in a data array
 * whose first quoted value is this element's first word, appearing exactly
 * once in the codebase — which is how `CONCERNS`, `reasons` and the rest of
 * this project's lists are written. The line is commented out rather than
 * removed, so it is visible in the diff and trivial to put back.
 *
 * Anything else is refused. "Delete this card" can mean removing JSX or
 * removing a row of data, and getting that wrong deletes the wrong thing.
 */
async function applyDelete(c: DesignChange): Promise<Result> {
  const first = (c.text.match(/[A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z'’-]+)?/) ?? [""])[0].trim();
  const what = `delete <${c.tag}>${first ? ` "${first}"` : ""}`;
  if (!first) return { ok: false, what, detail: "no text to identify it by — needs a human" };

  const hits = await find(`"${first}"`);
  if (hits.length !== 1) {
    return {
      ok: false,
      what,
      detail: hits.length === 0
        ? `no single-line entry found for "${first}" — this needs a human`
        : `"${first}" appears ${hits.length} times — too ambiguous to delete safely`,
    };
  }

  const h = hits[0];
  const start = h.text.lastIndexOf("\n", h.index) + 1;
  const end = h.text.indexOf("\n", h.index);
  const line = h.text.slice(start, end === -1 ? h.text.length : end);

  if (!/^\s*\{.*\},?\s*$/.test(line)) {
    return { ok: false, what, detail: "it is not a one-line data entry — this needs a human" };
  }

  const indent = line.match(/^\s*/)?.[0] ?? "";
  const commented = `${indent}// REMOVED in Size Lab:${line.trim().replace(/^\s*/, " ")}`;
  await writeFile(h.file, h.text.slice(0, start) + commented + h.text.slice(end === -1 ? h.text.length : end), "utf8");
  return { ok: true, what, file: rel(h.file), detail: "commented out — put it back by deleting the // ", edits: [{ before: line, after: commented }] };
}

/* ── the entry point ─────────────────────────────────────────────────────── */

export async function applyChange(c: DesignChange, viewport: number): Promise<Result[]> {
  const out: Result[] = [];
  try {
    if (c.removed) {
      out.push(await applyDelete(c));
      return out;
    }
    if (c.textChange) out.push(await applyText(c));
    if (Object.keys(c.props).length) out.push(await applyProps(c, viewport));
    if (out.length === 0) out.push({ ok: false, what: `<${c.tag}>`, detail: "nothing to apply" });
  } catch (err) {
    out.push({ ok: false, what: `<${c.tag}>`, detail: err instanceof Error ? err.message : String(err) });
  }
  return out;
}
