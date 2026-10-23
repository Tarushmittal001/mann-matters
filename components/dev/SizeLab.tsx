"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Size Lab — resize things in the browser, and hand the list back to be
 * written into the source properly.
 *
 * ── WHAT IT IS FOR ─────────────────────────────────────────────────────────
 * "That card is too big" and "that bit should go" are obvious on screen and
 * tedious to describe in words. This lets you point at the thing, shrink it
 * or delete it, and save. Saving does NOT edit any source file — it appends
 * to `design-changes.jsonl` at the repo root, which is then read and turned
 * into real changes by hand. The browser is a good place to decide what
 * should go and a bad place to decide which class or component carries it.
 *
 * ── DELETING ───────────────────────────────────────────────────────────────
 * Delete sets `display:none !important` rather than detaching the node. Three
 * reasons: it is reversible, the element stays readable so its `outerHTML`
 * can be recorded for the saved list, and React would put a detached node
 * straight back on the next render anyway.
 *
 * `protectedReason` refuses to delete crisis routing. CLAUDE.md makes that a
 * hard rule — it stays reachable from every page, never removed, hidden or
 * buried — and a tool that lets you hide the Tele-MANAS number and then hands
 * over a list saying "delete this" is a direct path through it. The refusal
 * belongs here, at the point of the action, not in a judgement call later.
 *
 * ── HOW IT FINDS THE CODE ──────────────────────────────────────────────────
 * **The className is what actually works here.** It is recorded in full, and
 * in this codebase those Tailwind strings are long and distinctive enough
 * that one grep lands on the exact line.
 *
 * `sourceOf` also walks React's fiber for `_debugSource` (file and line), but
 * measured against this build it comes back `null`: Next's SWC transform does
 * not emit it. It is kept because it costs nothing and would start working if
 * the transform ever did — it is a bonus, not the mechanism. Do not rely on it.
 *
 * Also recorded: the tag, a short sample of the element's own text, and an
 * nth-of-type DOM path, for the rare element whose classes are generic.
 *
 * ── IT MUST NEVER SHIP ─────────────────────────────────────────────────────
 * The component returns null outside development, and `/api/dev/size-lab`
 * 404s outside development. Two independent guards, because this writes a
 * file to disk and lives in the root layout.
 *
 * Keyboard: Ctrl/Cmd + Shift + L toggles. Esc deselects, then exits.
 */

/** What the route reports back for each change it tried to write. */
type ApplyResult = { ok: boolean; what: string; file?: string; detail: string };

type Change = {
  at: string;
  tag: string;
  /** file:line from React's fiber, when the dev build carries it. */
  source: string | null;
  /** the class string as it is in the source today — greppable */
  className: string;
  /** a short sample of the element's own text, to disambiguate repeats */
  text: string;
  /** nth-of-type path from body, as a last resort */
  path: string;
  /** how many elements on the page share this exact class string */
  siblings: number;
  /** what changed, as before → after, in px */
  props: Record<string, { from: string; to: string }>;
  /** true when this element was deleted rather than resized */
  removed: boolean;
  /** set when the copy was rewritten in place */
  textChange?: { from: string; to: string };
  /** when removed: the element's full outerHTML, trimmed — so what was taken
      out can be read back without guessing from a class string alone */
  html?: string;
  note: string;
};

/**
 * What may never be deleted.
 *
 * CLAUDE.md: crisis routing stays reachable from every page, and must never be
 * removed, hidden or buried. A tool that lets you hide the Tele-MANAS number
 * in the browser and then hands me a list saying "delete this" is a direct
 * path through that rule, so the block lives here rather than in my judgement
 * afterwards. It refuses if the element IS, or CONTAINS, any of these.
 */
const PROTECTED = [
  "[data-safety-notice]",
  "[data-crisis]",
  "a[href='/crisis']",
  "a[href^='tel:14416']",
  "a[href^='tel:112']",
];
const PROTECTED_TEXT = /\b(14416|tele-?manas)\b/i;

function protectedReason(el: HTMLElement): string | null {
  for (const sel of PROTECTED) {
    if (el.matches?.(sel) || el.querySelector?.(sel)) return "crisis routing";
  }
  if (PROTECTED_TEXT.test(el.textContent ?? "")) return "the Tele-MANAS number";
  return null;
}

/** The knobs. `vars` are the computed properties each one reads and writes. */
const KNOBS = [
  { key: "fontSize", label: "Text", vars: ["fontSize"], step: 1, unit: "px" },
  {
    key: "padding",
    label: "Padding",
    vars: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
    step: 2,
    unit: "px",
  },
  { key: "gap", label: "Gap", vars: ["rowGap", "columnGap"], step: 2, unit: "px" },
  { key: "width", label: "Width", vars: ["width"], step: 8, unit: "px" },
  { key: "height", label: "Height", vars: ["height"], step: 8, unit: "px" },
  { key: "borderRadius", label: "Radius", vars: ["borderRadius"], step: 2, unit: "px" },
  {
    key: "margin",
    label: "Margin",
    vars: ["marginTop", "marginRight", "marginBottom", "marginLeft"],
    step: 4,
    unit: "px",
  },
  { key: "lineHeight", label: "Line-h", vars: ["lineHeight"], step: 1, unit: "px" },
  { key: "letterSpacing", label: "Letter", vars: ["letterSpacing"], step: 0.2, unit: "px" },
] as const;

type KnobKey = (typeof KNOBS)[number]["key"];

/** React keeps its fiber on the DOM node under a hashed key. */
function fiberOf(el: Element): Record<string, unknown> | null {
  for (const k of Object.keys(el)) {
    if (k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")) {
      return (el as unknown as Record<string, Record<string, unknown>>)[k];
    }
  }
  return null;
}

/** Walk up the fiber tree for the nearest node that knows where it was written. */
function sourceOf(el: Element): string | null {
  let f = fiberOf(el);
  for (let i = 0; f && i < 12; i++) {
    const src = f._debugSource as { fileName?: string; lineNumber?: number } | undefined;
    if (src?.fileName) {
      const rel = src.fileName.replace(/\\/g, "/").split(/\/(?:app|components|lib)\//).slice(-1)[0];
      const dir = src.fileName.replace(/\\/g, "/").match(/\/(app|components|lib)\//)?.[1] ?? "";
      return `${dir ? dir + "/" : ""}${rel}:${src.lineNumber ?? "?"}`;
    }
    f = f.return as Record<string, unknown> | null;
  }
  return null;
}

function pathOf(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && parts.length < 8) {
    const parent: Element | null = node.parentElement;
    // index loops, not spread: this file compiles to a target that predates
    // iterating an HTMLCollection (same reason as lib/languages.ts)
    let i = 0;
    if (parent) {
      for (let c = 0; c < parent.children.length; c++) {
        const child = parent.children[c];
        if (child === node) break;
        if (child.tagName === node.tagName) i++;
      }
    }
    parts.unshift(`${node.tagName.toLowerCase()}${i > 0 ? `[${i}]` : ""}`);
    node = parent;
  }
  return parts.join(">");
}

/** Text the element owns itself, not the whole subtree's wall of words. */
function ownText(el: Element): string {
  const own: string[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    const n = el.childNodes[i];
    if (n.nodeType !== Node.TEXT_NODE) continue;
    const v = n.textContent?.trim();
    if (v) own.push(v);
  }
  const t = own.join(" ");
  return (t || el.textContent || "").trim().slice(0, 70);
}

const num = (v: string) => parseFloat(v) || 0;

export default function SizeLab() {
  const [on, setOn] = useState(false);
  /*
   * The clicked node is almost never the thing you meant. Clicking a card
   * lands on the <span> holding its label, because that is what is under the
   * cursor. So a click records the whole ANCESTOR CHAIN and a cursor into it:
   * the chips in the panel walk up to the card, the section, the page.
   */
  const [chain, setChain] = useState<HTMLElement[]>([]);
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState<HTMLElement | null>(null);
  const [, force] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  const [results, setResults] = useState<ApplyResult[]>([]);

  /** element → the inline styles it had before we touched it */
  const original = useRef(new Map<HTMLElement, string>());
  /** element → the computed value of each knob before we touched it */
  const baseline = useRef(new Map<HTMLElement, Record<string, string>>());
  const [edited, setEdited] = useState<HTMLElement[]>([]);
  /** elements hidden with Delete, kept so they can be put back */
  const [removed, setRemoved] = useState<HTMLElement[]>([]);
  const [blocked, setBlocked] = useState<string | null>(null);
  /** true while an element is contentEditable — every shortcut stands down */
  const [editing, setEditing] = useState(false);
  /** element → the copy it had before it was rewritten */
  const textBefore = useRef(new Map<HTMLElement, string>());
  /*
   * element → the CSS properties actually touched on it.
   *
   * Diffing computed styles against the baseline looked simpler and was
   * wrong: rewriting a heading to a longer line made it wrap, so its height
   * went 54px → 109px and the saved record claimed a height change nobody
   * asked for. Only what a knob, the scale row or a handle changed counts.
   */
  const touched = useRef(new Map<HTMLElement, string[]>());
  /** the drag in progress on one of the selection handles */
  const drag = useRef<{ axis: "x" | "y" | "xy"; x: number; y: number; w: number; h: number } | null>(
    null
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const sel: HTMLElement | null = chain[idx] ?? null;

  const markTouched = (el: HTMLElement, vars: readonly string[]) => {
    const list = touched.current.get(el) ?? [];
    for (const v of vars) if (list.indexOf(v) === -1) list.push(v);
    touched.current.set(el, list);
  };

  /** Remember an element's untouched state the first time it is edited. */
  const snapshot = useCallback((el: HTMLElement) => {
    if (baseline.current.has(el)) return;
    original.current.set(el, el.getAttribute("style") ?? "");
    const cs = getComputedStyle(el);
    const snap: Record<string, string> = {};
    for (const k of KNOBS) for (const v of k.vars) snap[v] = cs[v as never] as string;
    baseline.current.set(el, snap);
  }, []);

  const mine = useCallback(
    (el: Element | null) => !!el?.closest?.("[data-sizelab]"),
    []
  );

  /* ---------------------------------------------------------------- toggle */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setOn((v) => !v);
        setChain([]);
        setHover(null);
      }
      if (!on) return;
      /* While a copy edit is open, Del is a character and ↑↓ move the caret.
         Without this, typing into a heading deleted the heading. */
      if (editing) {
        if (e.key === "Escape") stopText();
        return;
      }
      if (e.key === "Escape") {
        if (chain.length) setChain([]);
        else setOn(false);
      }
      if (chain.length && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        remove();
      }
      // walk the chain without reaching for the mouse
      if (chain.length && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        setIdx((i) => Math.min(chain.length - 1, Math.max(0, i + (e.key === "ArrowUp" ? -1 : 1))));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, chain, editing]);

  /* ------------------------------------------------- pick an element, once */
  useEffect(() => {
    if (!on) return;
    const move = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      setHover(mine(el) || editing ? null : el);
    };
    const click = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (mine(el)) return;
      // clicking inside the text being edited places the caret; it must not
      // count as picking a new element
      if (editing) return;
      e.preventDefault();
      e.stopPropagation();
      const list: HTMLElement[] = [];
      let node: HTMLElement | null = el;
      while (node && node !== document.body && list.length < 10) {
        list.unshift(node);
        node = node.parentElement;
      }
      setChain(list);
      setIdx(list.length - 1); // start on what was clicked; chips walk outwards
    };
    document.addEventListener("mousemove", move, true);
    document.addEventListener("click", click, true);
    document.body.style.cursor = editing ? "" : "crosshair";
    return () => {
      document.removeEventListener("mousemove", move, true);
      document.removeEventListener("click", click, true);
      document.body.style.cursor = "";
    };
  }, [on, mine, editing]);

  /* ----------------------------------------------------------------- edits */
  const bump = (knob: (typeof KNOBS)[number], dir: -1 | 1) => {
    if (!sel) return;
    snapshot(sel);
    markTouched(sel, knob.vars);
    const cs = getComputedStyle(sel);
    for (const v of knob.vars) {
      const next = Math.max(0, num(cs[v as never] as string) + dir * knob.step);
      sel.style.setProperty(
        v.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
        `${next}px`,
        "important"
      );
    }
    setEdited((list) => (list.includes(sel) ? list : [...list, sel]));
    force((n) => n + 1);
  };

  /** Shrink or grow text, padding and gap together — "make this card smaller". */
  const scale = (factor: number) => {
    if (!sel) return;
    snapshot(sel);
    const SCALED = ["fontSize", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "rowGap", "columnGap"];
    markTouched(sel, SCALED);
    const cs = getComputedStyle(sel);
    for (const v of SCALED) {
      const cur = num(cs[v as never] as string);
      if (!cur) continue;
      sel.style.setProperty(
        v.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
        `${Math.round(cur * factor * 10) / 10}px`,
        "important"
      );
    }
    setEdited((list) => (list.includes(sel) ? list : [...list, sel]));
    force((n) => n + 1);
  };

  /**
   * Drag a handle on the selection box to set width and height.
   *
   * Stepping a number is fine when you know the number. Most of the time you
   * do not — you want the card narrower *until it looks right*, which is a
   * thing the hand decides and the eye confirms. So: a handle on the right
   * edge for width, the bottom edge for height, the corner for both.
   *
   * The handles live inside `[data-sizelab]`, so `mine()` is true for them
   * and grabbing one never counts as picking a new element.
   */
  const startDrag = (axis: "x" | "y" | "xy") => (e: React.PointerEvent) => {
    if (!sel) return;
    e.preventDefault();
    e.stopPropagation();
    snapshot(sel);
    markTouched(sel, axis === "x" ? ["width"] : axis === "y" ? ["height"] : ["width", "height"]);
    const r = sel.getBoundingClientRect();
    drag.current = { axis, x: e.clientX, y: e.clientY, w: r.width, h: r.height };

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || !sel) return;
      if (d.axis !== "y") {
        sel.style.setProperty("width", `${Math.max(16, Math.round(d.w + (ev.clientX - d.x)))}px`, "important");
      }
      if (d.axis !== "x") {
        sel.style.setProperty("height", `${Math.max(16, Math.round(d.h + (ev.clientY - d.y)))}px`, "important");
      }
      force((n) => n + 1);
    };
    const up = () => {
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setEdited((list) => (sel && list.indexOf(sel) > -1 ? list : sel ? [...list, sel] : list));
      force((n) => n + 1);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /**
   * Rewrite the copy in place.
   *
   * `contentEditable` on the element itself, so what you type is set in the
   * real face at the real size on the real background — which is the whole
   * reason to edit copy here rather than in the file.
   *
   * Caveat worth knowing: React owns this DOM. If the component re-renders
   * while you are typing (a state change somewhere, a Fast Refresh save) your
   * text is replaced by whatever the source says. Finish an edit before doing
   * anything else, and save often.
   */
  const startText = () => {
    if (!sel) return;
    snapshot(sel);
    if (!textBefore.current.has(sel)) textBefore.current.set(sel, sel.innerText);
    sel.setAttribute("contenteditable", "plaintext-only");
    sel.style.setProperty("outline", "2px dashed #C8A45D", "important");
    sel.focus();
    // put the caret at the end rather than wherever the click landed
    const r = document.createRange();
    r.selectNodeContents(sel);
    r.collapse(false);
    const s2 = window.getSelection();
    s2?.removeAllRanges();
    s2?.addRange(r);
    setEditing(true);
  };

  const stopText = () => {
    if (!sel) return;
    sel.removeAttribute("contenteditable");
    sel.style.removeProperty("outline");
    setEditing(false);
    const was = textBefore.current.get(sel);
    if (was !== undefined && was !== sel.innerText) {
      setEdited((list) => (list.indexOf(sel) > -1 ? list : [...list, sel]));
    }
    force((n) => n + 1);
  };

  /**
   * Delete, as far as the browser is concerned: `display:none`, which is
   * reversible and leaves the element in the DOM so it can be read back when
   * the list is saved. Nothing is torn out of the tree — a removed node could
   * not be restored, and React would put it back on the next render anyway.
   */
  const remove = () => {
    if (!sel) return;
    const why = protectedReason(sel);
    if (why) {
      setBlocked(`Cannot delete ${why}. It has to stay reachable on every page.`);
      return;
    }
    setBlocked(null);
    snapshot(sel);
    sel.style.setProperty("display", "none", "important");
    setRemoved((list) => (list.includes(sel) ? list : [...list, sel]));
    setEdited((list) => (list.includes(sel) ? list : [...list, sel]));
    // the thing you were pointing at is gone; step out to its parent
    setIdx((i) => Math.max(0, i - 1));
    force((n) => n + 1);
  };

  const restore = (el: HTMLElement) => {
    el.style.removeProperty("display");
    setRemoved((list) => list.filter((x) => x !== el));
    force((n) => n + 1);
  };

  const resetEl = (el: HTMLElement) => {
    const was = textBefore.current.get(el);
    if (was !== undefined && el.innerText !== was) {
      el.removeAttribute("contenteditable");
      el.innerText = was;
    }
    textBefore.current.delete(el);
    touched.current.delete(el);
    const s = original.current.get(el);
    if (s === undefined) return;
    if (s) el.setAttribute("style", s);
    else el.removeAttribute("style");
    setEdited((list) => list.filter((x) => x !== el));
    setRemoved((list) => list.filter((x) => x !== el));
    force((n) => n + 1);
  };

  const resetAll = () => {
    for (const el of edited) resetEl(el);
    setEdited([]);
    setRemoved([]);
    setSaved(null);
    setBlocked(null);
  };

  /* ------------------------------------------------------------------ save */
  /** The edits, as before → after, read off the live elements. */
  const buildChanges = (): Change[] =>
    edited.map((el) => {
      const before = baseline.current.get(el) ?? {};
      const cs = getComputedStyle(el);
      const props: Change["props"] = {};
      for (const v of touched.current.get(el) ?? []) {
        const from = before[v];
        const to = cs[v as never] as string;
        if (from !== undefined && from !== to) props[v] = { from, to };
      }
      const gone = removed.indexOf(el) > -1;
      /* How many elements on this page carry the identical class string. If
         more than one, they almost certainly come from a single `.map()` and
         changing the source changes all of them. */
      const cls = typeof el.className === "string" ? el.className : "";
      const siblings = cls
        ? document.querySelectorAll(
            "." + cls.trim().split(/\s+/).map((c) => CSS.escape(c)).join(".")
          ).length
        : 1;
      const wasText = textBefore.current.get(el);
      const nowText = el.innerText;
      return {
        at: location.pathname,
        tag: el.tagName.toLowerCase(),
        source: sourceOf(el),
        className: typeof el.className === "string" ? el.className : "",
        text: ownText(el),
        path: pathOf(el),
        siblings,
        // a deleted element's size changes are noise; only the deletion matters
        props: gone ? {} : props,
        removed: gone,
        textChange:
          !gone && wasText !== undefined && wasText !== nowText
            ? { from: wasText, to: nowText }
            : undefined,
        html: gone ? el.outerHTML.replace(/\s+/g, " ").slice(0, 1200) : undefined,
        note: "",
      };
    });

  /*
   * Every path out of here ends in a message on the panel. The first version
   * swallowed its own failures: an async click handler's rejection goes
   * nowhere, so a save that never left the browser looked exactly like one
   * that worked.
   */
  const save = async (apply: boolean) => {
    let changes: Change[];
    try {
      changes = buildChanges();
    } catch (err) {
      setSaved(`Could not read the edits: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    if (changes.length === 0) {
      setSaved("Nothing changed on any of those.");
      return;
    }
    setSaved(apply ? "Writing to the source…" : "Saving…");
    setResults([]);
    try {
      const res = await fetch("/api/dev/size-lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ viewport: window.innerWidth, changes, apply }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        file?: string;
        error?: string;
        written?: number;
        skipped?: number;
        results?: ApplyResult[];
      };
      if (!res.ok) {
        setSaved(`${res.status}: ${body.error ?? "could not save"}`);
        return;
      }
      if (apply) {
        setResults(body.results ?? []);
        setSaved(
          `${body.written ?? 0} written to source, ${body.skipped ?? 0} skipped. ` +
            "The dev server will reload; your browser edits are then the real thing."
        );
      } else {
        setSaved(`Saved ${changes.length} to ${body.file ?? "design-changes.jsonl"} — tell Claude`);
      }
    } catch (err) {
      setSaved(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (process.env.NODE_ENV !== "development") return null;

  const box = (el: HTMLElement | null) => el?.getBoundingClientRect();
  const h = box(hover);
  const s = box(sel);
  const cs = sel ? getComputedStyle(sel) : null;

  return (
    <div data-sizelab="">
      {/* the switch */}
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        /* bottom CENTRE on purpose: the safety pill and chat launcher own
           the bottom-left, and WhatsApp owns the bottom-right. */
        className="fixed bottom-4 left-1/2 z-[9998] -translate-x-1/2 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold shadow-lg"
        style={{ background: on ? "#C8A45D" : "#0A2E28", color: on ? "#06211C" : "#F7F4EE" }}
        title="Ctrl/Cmd + Shift + L"
      >
        SIZE LAB {on ? "ON" : "OFF"}
        {edited.length > 0 && ` · ${edited.length}`}
      </button>

      {on && (
        <>
          {/* what the cursor is over */}
          {h && !sel && (
            <div
              className="pointer-events-none fixed z-[9997]"
              style={{
                left: h.left,
                top: h.top,
                width: h.width,
                height: h.height,
                outline: "1.5px solid #C8A45D",
                background: "rgba(200,164,93,0.10)",
              }}
            />
          )}

          {/* what is selected, with handles for width and height */}
          {s && (
            <div
              className="pointer-events-none fixed z-[9997]"
              style={{
                left: s.left,
                top: s.top,
                width: s.width,
                height: s.height,
                outline: editing ? "2px dashed #C8A45D" : "2px solid #2E8C8C",
                background: editing ? "transparent" : "rgba(46,140,140,0.08)",
              }}
            >
              {!editing &&
                (
                  [
                    ["x", "right", { right: -5, top: "50%", marginTop: -11, width: 10, height: 22, cursor: "ew-resize" }],
                    ["y", "bottom", { bottom: -5, left: "50%", marginLeft: -11, width: 22, height: 10, cursor: "ns-resize" }],
                    ["xy", "corner", { right: -6, bottom: -6, width: 12, height: 12, cursor: "nwse-resize" }],
                  ] as const
                ).map(([axis, name, css]) => (
                  <span
                    key={name}
                    role="presentation"
                    onPointerDown={startDrag(axis)}
                    className="pointer-events-auto absolute rounded-sm"
                    style={{ background: "#2E8C8C", border: "1.5px solid #FCFAF6", ...css }}
                    title={`Drag to set ${name === "right" ? "width" : name === "bottom" ? "height" : "both"}`}
                  />
                ))}
            </div>
          )}

          {/* the panel */}
          <div
            ref={panelRef}
            className="fixed bottom-20 right-4 z-[9999] max-h-[70vh] w-[310px] overflow-auto rounded-xl p-3 font-mono text-[11px] shadow-2xl"
            style={{ background: "#06211C", color: "#F7F4EE", border: "1px solid rgba(247,244,238,0.18)" }}
          >
            {!sel ? (
              <p className="leading-relaxed opacity-70">
                Click anything on the page.
                <br />
                You will land on the innermost element — use the chips or
                ↑/↓ to walk out to the card or the section you meant.
                <br />
                Del removes the selected one. Drag the teal handles on the
                box to set width and height.
                <br />
                Esc deselects · Ctrl/Cmd+Shift+L exits
              </p>
            ) : (
              <>
                <div className="mb-2 border-b border-white/15 pb-2">
                  <p className="font-bold" style={{ color: "#C8A45D" }}>
                    &lt;{sel.tagName.toLowerCase()}&gt; {Math.round(s?.width ?? 0)}×{Math.round(s?.height ?? 0)}
                  </p>

                  {/*
                    The chain, outermost first. Clicking a card lands on the
                    span under the cursor; these are how you get to the card.
                    Also ↑ / ↓.
                  */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-[3px]">
                    {chain.map((el, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIdx(i)}
                        onMouseEnter={() => setHover(el)}
                        onMouseLeave={() => setHover(null)}
                        className="rounded px-1 py-[1px]"
                        style={{
                          fontSize: 9.5,
                          background: i === idx ? "#2E8C8C" : "rgba(247,244,238,0.10)",
                          color: i === idx ? "#FCFAF6" : "rgba(247,244,238,0.65)",
                        }}
                        title={typeof el.className === "string" ? el.className : ""}
                      >
                        {el.tagName.toLowerCase()}
                        {removed.indexOf(el) > -1 ? " ✕" : edited.indexOf(el) > -1 ? " *" : ""}
                      </button>
                    ))}
                  </div>

                  <p className="mt-1.5 break-all opacity-55" style={{ fontSize: 10 }}>
                    {sourceOf(sel) ?? (typeof sel.className === "string" ? sel.className.slice(0, 90) : "")}
                  </p>
                </div>

                {/* the quick one */}
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="w-[54px] opacity-70">Scale</span>
                  {[0.8, 0.9, 1.1].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => scale(f)}
                      className="rounded px-2 py-1 font-bold"
                      style={{ background: "rgba(247,244,238,0.12)" }}
                    >
                      {f < 1 ? `−${Math.round((1 - f) * 100)}%` : `+${Math.round((f - 1) * 100)}%`}
                    </button>
                  ))}
                  <span className="opacity-45" style={{ fontSize: 10 }}>
                    text+pad+gap
                  </span>
                </div>

                {KNOBS.map((k) => {
                  const v = cs ? (cs[k.vars[0] as never] as string) : "";
                  return (
                    <div key={k.key} className="flex items-center gap-1.5 py-[3px]">
                      <span className="w-[54px] opacity-70">{k.label}</span>
                      <button
                        type="button"
                        onClick={() => bump(k, -1)}
                        className="h-5 w-5 rounded font-bold"
                        style={{ background: "rgba(247,244,238,0.12)" }}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bump(k, 1)}
                        className="h-5 w-5 rounded font-bold"
                        style={{ background: "rgba(247,244,238,0.12)" }}
                      >
                        +
                      </button>
                      <span className="tabular-nums opacity-60">{v}</span>
                    </div>
                  );
                })}

                <div className="mt-2 flex gap-1.5 border-t border-white/15 pt-2">
                  <button
                    type="button"
                    onClick={() => sel && resetEl(sel)}
                    className="flex-1 rounded px-2 py-1.5"
                    style={{ background: "rgba(247,244,238,0.12)" }}
                  >
                    Reset this
                  </button>
                  <button
                    type="button"
                    onClick={() => setChain([])}
                    className="flex-1 rounded px-2 py-1.5"
                    style={{ background: "rgba(247,244,238,0.12)" }}
                  >
                    Pick another
                  </button>
                </div>

                {editing ? (
                  <button
                    type="button"
                    onClick={stopText}
                    className="mt-1.5 w-full rounded px-2 py-1.5 font-bold"
                    style={{ background: "#C8A45D", color: "#06211C" }}
                  >
                    Done editing · Esc
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startText}
                    disabled={!sel.innerText.trim()}
                    className="mt-1.5 w-full rounded px-2 py-1.5 font-bold disabled:opacity-35"
                    style={{ background: "rgba(200,164,93,0.25)", color: "#E6CE9B" }}
                  >
                    {sel.innerText.trim() ? "Edit the words" : "No text here"}
                  </button>
                )}

                {editing && (
                  <p className="mt-1.5 leading-relaxed opacity-60" style={{ fontSize: 10 }}>
                    Type straight into the page. React may overwrite this if the
                    component re-renders — finish and save.
                  </p>
                )}

                {sel && removed.indexOf(sel) > -1 ? (
                  <button
                    type="button"
                    onClick={() => restore(sel)}
                    className="mt-1.5 w-full rounded px-2 py-1.5 font-bold"
                    style={{ background: "rgba(95,169,138,0.25)", color: "#9FD9C2" }}
                  >
                    Bring it back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={remove}
                    className="mt-1.5 w-full rounded px-2 py-1.5 font-bold"
                    style={{ background: "#C56A72", color: "#FCFAF6" }}
                  >
                    Delete this &lt;{sel.tagName.toLowerCase()}&gt; · Del
                  </button>
                )}

                {blocked && (
                  <p className="mt-1.5 leading-relaxed" style={{ color: "#E8A0A6", fontSize: 10 }}>
                    {blocked}
                  </p>
                )}
              </>
            )}

            {removed.length > 0 && (
              <div className="mt-2 border-t border-white/15 pt-2">
                <p className="mb-1 opacity-70" style={{ fontSize: 10 }}>
                  Deleted ({removed.length}) — click one to bring it back:
                </p>
                <div className="flex flex-wrap gap-1">
                  {removed.map((el, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => restore(el)}
                      className="rounded px-1.5 py-[2px]"
                      style={{ fontSize: 9.5, background: "rgba(197,106,114,0.32)" }}
                    >
                      {el.tagName.toLowerCase()}
                      {ownText(el) ? " · " + ownText(el).slice(0, 18) : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {edited.length > 0 && (
              <div className="mt-2 flex gap-1.5 border-t border-white/15 pt-2">
                <button
                  type="button"
                  onClick={() => save(true)}
                  className="flex-1 rounded px-2 py-1.5 font-bold"
                  style={{ background: "#5FA98A", color: "#06211C" }}
                  title="Rewrites the source files now"
                >
                  Apply {edited.length} to code
                </button>
                <button
                  type="button"
                  onClick={() => save(false)}
                  className="rounded px-2 py-1.5"
                  style={{ background: "rgba(200,164,93,0.3)", color: "#E6CE9B" }}
                  title="Only records the list; nothing is written to source"
                >
                  Just note
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded px-2 py-1.5"
                  style={{ background: "rgba(247,244,238,0.12)" }}
                >
                  Undo
                </button>
              </div>
            )}

            {saved && (
              <p className="mt-2 leading-relaxed" style={{ color: "#5FA98A", fontSize: 10 }}>
                {saved}
              </p>
            )}

            {results.length > 0 && (
              <ul className="mt-2 space-y-1.5 border-t border-white/15 pt-2">
                {results.map((r, i) => (
                  <li key={i} className="leading-snug" style={{ fontSize: 9.5 }}>
                    <span style={{ color: r.ok ? "#5FA98A" : "#E8A0A6" }}>
                      {r.ok ? "✓" : "✗"} {r.what}
                    </span>
                    <br />
                    <span className="opacity-60">
                      {r.file ? `${r.file} — ` : ""}
                      {r.detail}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
