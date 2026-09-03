"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DEFAULT_LANG,
  LANGUAGES,
  UI,
  scenarios,
  type Lang,
  type Message,
} from "./scenarios";
import TypingDots from "./TypingDots";

type DisplayMessage = Message & {
  id: string;
  /**
   * Where this bubble came from in the scripted thread. Present only on scripted
   * lines — that's what makes them translatable in place. A visitor's own typed
   * words carry no ref and are never rewritten.
   */
  script?: { scenario: string; index: number };
  /** Manu's stock reply to free text; has a counterpart in every language. */
  canned?: boolean;
};

const TYPING_DELAY = 900;
const MESSAGE_GAP = 400;
const LANG_KEY = "emoraa.manu.lang";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

let msgCounter = 0;
function makeId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((l) => l.id === value);
}

export default function TryManuDemo({
  liveMode = false,
  onTryLive,
  embedded = false,
}: {
  liveMode?: boolean;
  onTryLive?: () => void;
  /** Render only the chat card, for use inside another section. */
  embedded?: boolean;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [activeScenario, setActiveScenario] = useState(scenarios[0].id);
  const [input, setInput] = useState("");
  // SSR and first paint always use the default; a saved preference is applied
  // on mount, so the server and client markup can't disagree
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const tokenRef = useRef(0);
  // read inside the playback loop so a language change mid-animation is picked
  // up by the messages still to come, not just the ones already on screen
  const langRef = useRef<Lang>(DEFAULT_LANG);
  const listRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const ui = UI[lang];
  const langTag = LANGUAGES.find((l) => l.id === lang)?.tag ?? "en";
  // Plus Jakarta Sans has no Devanagari; Tiro is the brand's script face
  const bodyFont = lang === "hi" ? "font-deva" : "font-sans";

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const playThread = useCallback(
    async (scenarioId: string) => {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      const token = ++tokenRef.current;
      setMessages([]);
      setTyping(false);

      const count = scenario.thread[langRef.current].length;

      for (let i = 0; i < count; i++) {
        if (tokenRef.current !== token) return;

        // resolved per step, against whichever language is current right now
        const msg = scenario.thread[langRef.current][i];
        if (!msg) return;

        if (msg.role === "manu" && !reducedMotion) {
          setTyping(true);
          scrollToBottom();
          await new Promise((r) => setTimeout(r, TYPING_DELAY));
          if (tokenRef.current !== token) return;
          setTyping(false);
        }

        setMessages((prev) => [
          ...prev,
          { ...msg, id: makeId(), script: { scenario: scenario.id, index: i } },
        ]);
        scrollToBottom();

        if (!reducedMotion) {
          await new Promise((r) => setTimeout(r, MESSAGE_GAP));
        }
      }
    },
    [reducedMotion, scrollToBottom],
  );

  useEffect(() => {
    let initial = DEFAULT_LANG;
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (isLang(saved)) initial = saved;
    } catch {
      // private mode, blocked storage — the default is a fine answer
    }
    langRef.current = initial;
    setLang(initial);
    playThread(scenarios[0].id);

    return () => {
      ++tokenRef.current;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Convert the conversation already on screen, rather than replaying it. The
   * reader keeps their place — same bubbles, same order, new language — which
   * is the whole point: seeing the *same* care expressed in your own words.
   */
  const changeLang = (next: Lang) => {
    if (next === lang) return;

    langRef.current = next;
    setLang(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // preference just won't persist; nothing else depends on it
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.script) {
          const scenario = scenarios.find((s) => s.id === m.script!.scenario);
          const replacement = scenario?.thread[next][m.script!.index];
          return replacement ? { ...m, text: replacement.text } : m;
        }
        if (m.canned) return { ...m, text: UI[next].cannedReply };
        // whatever the visitor typed stays exactly as they wrote it
        return m;
      }),
    );
  };

  const selectScenario = (id: string) => {
    setActiveScenario(id);
    playThread(id);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text, id: makeId() }]);
    scrollToBottom();

    const fallback = UI[langRef.current].cannedReply;

    if (liveMode) {
      setTyping(true);
      scrollToBottom();
      try {
        const res = await fetch("/api/manu-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // tell the endpoint which language to answer in
          body: JSON.stringify({ message: text, lang: langRef.current }),
        });
        const data = await res.json();
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          data.reply
            ? { role: "manu", text: data.reply, id: makeId() }
            : { role: "manu", text: fallback, id: makeId(), canned: true },
        ]);
      } catch {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "manu", text: fallback, id: makeId(), canned: true },
        ]);
      }
      scrollToBottom();
      return;
    }

    if (!reducedMotion) {
      setTyping(true);
      scrollToBottom();
      await new Promise((r) => setTimeout(r, TYPING_DELAY));
      setTyping(false);
    }

    setMessages((prev) => [
      ...prev,
      { role: "manu", text: fallback, id: makeId(), canned: true },
    ]);
    scrollToBottom();
  };

  const bubbleVariants = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
      };

  const card = (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-sage/20 bg-ivory-light shadow-bloom">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-forest px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* Avatar orb */}
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-sage to-gold shrink-0 animate-breathe">
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-forest" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-ivory">Manu</span>
            <span className="rounded-full bg-ivory/15 px-2 py-0.5 text-[10px] font-sans uppercase tracking-wider text-ivory/70">
              AI-powered
            </span>
          </div>
        </div>

        {/* SOS */}
        <a
          href="/crisis?sos=true"
          className="flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-500 transition-colors"
          aria-label="SOS — get crisis help now"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
            <path d="M8 1a1 1 0 0 1 .894.553l6 12A1 1 0 0 1 14 15H2a1 1 0 0 1-.894-1.447l6-12A1 1 0 0 1 8 1Zm0 4a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1Zm0 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          </svg>
          SOS
        </a>
      </div>

      {/* Language switcher */}
      <div className="flex items-center justify-between gap-3 border-b border-sage/10 bg-ivory/40 px-4 py-2.5">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-ink/45">
          {ui.languageLabel}
        </span>
        <div
          role="radiogroup"
          aria-label={ui.languageLabel}
          className="inline-flex items-center gap-0.5 rounded-full bg-sage/20 p-0.5"
        >
          {LANGUAGES.map((l) => {
            const active = lang === l.id;
            return (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={active}
                lang={l.tag}
                onClick={() => changeLang(l.id)}
                className={`rounded-full px-3 py-1 text-[13px] leading-5 transition-all ${
                  l.id === "hi" ? "font-deva" : "font-sans"
                } ${
                  active
                    ? "bg-forest text-ivory shadow-lift font-semibold"
                    : "text-forest-700 hover:bg-sage/30 font-medium"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario chips */}
      <div
        className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-sage/10 scrollbar-none"
        role="tablist"
        aria-label={ui.scenarioListLabel}
        lang={langTag}
      >
        {scenarios.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={activeScenario === s.id}
            onClick={() => selectScenario(s.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-all whitespace-nowrap ${bodyFont} ${
              activeScenario === s.id
                ? "bg-forest text-ivory shadow-lift"
                : "bg-sage/15 text-forest-700 hover:bg-sage/30"
            }`}
          >
            {s.chipLabel[lang]}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={ui.chatLabel}
        lang={langTag}
        className="flex flex-col gap-3 px-4 py-5 h-80 overflow-y-auto scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              {...bubbleVariants}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${bodyFont} ${
                msg.role === "user"
                  ? "self-end bg-gold/25 text-forest-900 rounded-br-md"
                  : "self-start bg-sage/20 text-forest-900 rounded-bl-md"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <div className="self-start">
            <TypingDots />
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="border-t border-sage/10 px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ui.placeholder}
            lang={langTag}
            className={`flex-1 rounded-xl bg-ivory px-4 py-2.5 text-sm text-forest-900 placeholder:text-ink/40 border border-sage/20 focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-colors ${bodyFont}`}
            aria-label={ui.inputLabel}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-forest-950 hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label={ui.sendLabel}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M2.94 4.34a1 1 0 0 1 1.34-.47L17.7 9.53a1 1 0 0 1 0 1.79l-13.42 5.66a1 1 0 0 1-1.38-1.13l1.5-5.1a.5.5 0 0 0 0-.28l-1.5-5.1a1 1 0 0 1 .04-.63Z" />
            </svg>
          </button>
        </form>

        <div className="mt-3 flex flex-col items-center gap-2">
          <p className={`text-xs text-ink/40 text-center ${bodyFont}`} lang={langTag}>
            {ui.previewNote}
          </p>
          {!embedded && (
            <button
              onClick={onTryLive ?? (() => (window.location.href = "/manu"))}
              lang={langTag}
              className={`rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-forest-700 transition-colors ${bodyFont}`}
            >
              {ui.tryLive}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="try-manu-heading">
      <div className="wrap">
        {/* ── Heading ── */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2
            id="try-manu-heading"
            className="font-display text-3xl sm:text-4xl lg:text-5xl text-forest leading-tight"
          >
            Meet Manu — your 4&nbsp;a.m. dost
          </h2>
          <p className="mt-4 text-lg text-ink/70 font-sans">
            Empathetic, judgement-free support that actually speaks your language.
          </p>
        </div>

        {card}
      </div>
    </section>
  );
}
