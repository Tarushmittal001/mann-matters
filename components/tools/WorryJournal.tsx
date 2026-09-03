"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A private worry dump. Write what's spiralling, then either keep it (saved
 * to localStorage only — never uploaded) or let it go (animates away and is
 * never stored anywhere). Entries load after mount so SSR stays clean.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const STORE_KEY = "emoraa-worry-journal";

type Entry = { id: string; text: string; date: string };

const prompts = [
  "What's been circling in your head today?",
  "What's the worry underneath the worry?",
  "If your mind could say one thing out loud right now…",
  "What are you carrying that isn't yours to carry?",
  "What would you tell a friend who felt like this?",
];

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: Entry[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(entries));
  } catch {
    // storage full or blocked — the write simply doesn't persist
  }
}

export default function WorryJournal() {
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [prompt, setPrompt] = useState(prompts[0]);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setLoaded(true);
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, []);

  const keep = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry: Entry = {
      id: `${Date.now()}`,
      text: trimmed,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    const next = [entry, ...entries];
    setEntries(next);
    saveEntries(next);
    setText("");
  };

  const letGo = () => {
    if (!text.trim() || releasing) return;
    setReleasing(true);
    // the words float away; nothing is stored, anywhere
    setTimeout(() => {
      setText("");
      setReleasing(false);
    }, reduce ? 150 : 1100);
  };

  const remove = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  };

  const clearAll = () => {
    setEntries([]);
    saveEntries([]);
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift sm:p-10">
        <div className="relative">
          <motion.textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={prompt}
            rows={6}
            disabled={releasing}
            animate={
              releasing
                ? reduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: -48, filter: "blur(6px)" }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={{ duration: reduce ? 0.15 : 1, ease: EASE }}
            className="w-full resize-none rounded-2xl border border-forest-800/15 bg-ivory p-5 text-[0.98rem] leading-relaxed text-forest-900 placeholder:text-ink/35 focus:border-forest-600 focus:outline-none"
          />
          {releasing && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink/50">
              …and it&apos;s gone.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={letGo}
            disabled={!text.trim() || releasing}
            className="rounded-full bg-forest-800 px-7 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Let it go
          </button>
          <button
            onClick={keep}
            disabled={!text.trim() || releasing}
            className="rounded-full border border-forest-800/20 px-7 py-3 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40"
          >
            Keep it here
          </button>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-ink/45">
          <strong className="font-semibold text-ink/60">Completely private.</strong>{" "}
          &ldquo;Let it go&rdquo; stores nothing, anywhere. &ldquo;Keep it
          here&rdquo; saves only to this device — nothing ever leaves your
          browser.
        </p>
      </div>

      {/* kept worries */}
      {loaded && entries.length > 0 && (
        <div className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="eyebrow">Kept on this device</h2>
            <button onClick={clearAll} className="link-draw text-xs text-ink/50">
              Clear all
            </button>
          </div>
          <ul className="grid gap-3">
            <AnimatePresence initial={false}>
              {entries.map((e) => (
                <motion.li
                  key={e.id}
                  layout={!reduce}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5 shadow-lift"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink/80">
                      {e.text}
                    </p>
                    <button
                      onClick={() => remove(e.id)}
                      aria-label="Let this one go"
                      title="Let this one go"
                      className={cn(
                        "mt-0.5 shrink-0 rounded-full p-1.5 text-ink/35 transition-colors",
                        "hover:bg-sage-light/50 hover:text-forest-800"
                      )}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-ink/40">{e.date}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}
