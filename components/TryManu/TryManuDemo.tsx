"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
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
import { site } from "@/lib/site";

const WA_PATH =
  "M12.04 2c-5.5 0-9.94 4.44-9.94 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.49 0 9.94-4.44 9.94-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.96 1.36-.5.05-1.14.07-1.84-.11-.42-.13-.97-.31-1.66-.61-2.93-1.26-4.84-4.2-4.99-4.4-.14-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.43.27-.29.58-.36.78-.36l.55.01c.18 0 .42-.07.65.5.24.59.82 2.02.89 2.17.07.14.12.31.02.5-.09.2-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.93 1.93 1.22 2.21 1.36.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.61.76 1.88.9.27.14.46.2.53.32.07.11.07.66-.17 1.34Z";

/** Where sign-in brings people back to: this chat, on the home page. */
const SIGN_IN_HREF = "/login?next=%2F%23manu";
const SIGN_UP_HREF = "/signup?next=%2F%23manu";

type DisplayMessage = Message & {
  /** A card inviting a signed-out visitor to sign in, shown in place of a bubble. */
  gate?: boolean;
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
  // coach-mark: points at a topic until the visitor taps one, then is gone
  const [explored, setExplored] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [hintPos, setHintPos] = useState<{ chip: number; bubble: number; top: number } | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [input, setInput] = useState("");
  // undefined while checking, null when signed out
  const [me, setMe] = useState<{ name: string } | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => alive && setMe(d.user ? { name: d.user.name } : null))
      .catch(() => alive && setMe(null));
    return () => {
      alive = false;
    };
  }, []);
  const signedIn = !!me;
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
    setExplored(true);
    playThread(id);
  };

  // the topics it points at: every one but the conversation already playing
  const hintTargets = scenarios
    .map((s, i) => (s.id === activeScenario ? -1 : i))
    .filter((i) => i >= 0);
  const hintIndex = hintTargets[hintStep % hintTargets.length];

  // appear once the opening conversation has had a moment, then hop along the
  // topics; with reduced motion it just sits on the first one
  useEffect(() => {
    if (explored) return;
    const show = window.setTimeout(() => setHintOn(true), 3200);
    if (reducedMotion) return () => window.clearTimeout(show);
    const hop = window.setInterval(() => setHintStep((n) => n + 1), 2800);
    return () => {
      window.clearTimeout(show);
      window.clearInterval(hop);
    };
  }, [explored, reducedMotion]);

  // measure where the pointed-at chip sits, so the bubble's arrow lands on it
  useLayoutEffect(() => {
    if (explored || !hintOn) return;
    const measure = () => {
      const wrap = chipsRef.current;
      const chip = chipRefs.current[hintIndex];
      if (!wrap || !chip) return;
      const w = wrap.getBoundingClientRect();
      const c = chip.getBoundingClientRect();
      const center = c.left - w.left + c.width / 2;
      const BUBBLE = 232;
      const bubble = Math.min(Math.max(center - BUBBLE / 2, 4), Math.max(4, w.width - BUBBLE - 4));
      setHintPos({ chip: center, bubble, top: c.bottom - w.top + 10 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [explored, hintOn, hintIndex, lang]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text, id: makeId() }]);
    scrollToBottom();

    const fallback = UI[langRef.current].cannedReply;

    // signed in: the real Manu answers
    if (signedIn) {
      const sent = text;
      setTyping(true);
      scrollToBottom();
      let reply = "Manu couldn't reply just now. Please try again, or reach us on WhatsApp.";
      try {
        const res = await fetch("/api/manu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: sent }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.reply?.text) reply = data.reply.text;
        else if (typeof data.error === "string") reply = data.error;
      } catch {
        // keep the friendly fallback
      }
      setTyping(false);
      setMessages((prev) => [...prev, { role: "manu", text: reply, id: makeId() }]);
      scrollToBottom();
      return;
    }

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

    // signed out: a short reply, then one invitation card (never stacked twice)
    setMessages((prev) => [
      ...prev.filter((m) => !m.gate),
      { role: "manu", text: fallback, id: makeId(), canned: true },
      { role: "manu", text: "", id: makeId(), gate: true },
    ]);
    scrollToBottom();
    // the card springs in after a beat; follow it down so it's fully in view
    window.setTimeout(scrollToBottom, 650);
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
            <AnimatePresence mode="wait" initial={false}>
              {signedIn ? (
                <motion.span
                  key="live"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 rounded-full bg-green-400/15 px-2 py-0.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-green-300"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-300" />
                  </span>
                  {ui.liveBadge}
                </motion.span>
              ) : (
                <motion.span
                  key="ai"
                  className="rounded-full bg-ivory/15 px-2 py-0.5 text-[10px] font-sans uppercase tracking-wider text-ivory/70"
                >
                  AI-powered
                </motion.span>
              )}
            </AnimatePresence>
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
                className={`rounded-full px-3 py-1 text-[13px] leading-5 transition ${
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

      {/* Scenario chips. They wrap instead of scrolling sideways. On their
          own they read like labels, so until the visitor taps one, a small
          coach-mark hops from topic to topic with a tapping hand. */}
      <div ref={chipsRef} className="relative z-20 border-b border-sage/10 px-4 py-3" lang={langTag}>
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label={ui.scenarioListLabel}
      >
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            role="tab"
            aria-selected={activeScenario === s.id}
            onClick={() => selectScenario(s.id)}
            className={`relative shrink-0 rounded-full px-3 py-1 text-[13px] transition whitespace-nowrap ${bodyFont} ${
              activeScenario === s.id
                ? "bg-forest text-ivory shadow-lift"
                : "bg-sage/15 text-forest-700 hover:bg-sage/30"
            }`}
          >
            {/* a soft ring pulses on the topic the coach-mark is pointing at */}
            {!explored && hintOn && hintIndex === i && (
              <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-gold/70">
                {!reducedMotion && (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-2 ring-gold/60"
                    animate={{ scale: [1, 1.12], opacity: [0.8, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </span>
            )}
            {s.chipLabel[lang]}
          </button>
        ))}
      </div>

        <AnimatePresence>
          {!explored && hintOn && hintPos && (
            <motion.button
              type="button"
              key="coach"
              onClick={() => selectScenario(scenarios[hintIndex].id)}
              className={`absolute z-30 flex w-[232px] items-center gap-2.5 rounded-2xl bg-forest-900 py-2.5 pl-2.5 pr-3.5 text-left text-[12.5px] font-medium leading-snug text-ivory shadow-bloom ${bodyFont}`}
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1, left: hintPos.bubble, top: hintPos.top }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              style={{ left: hintPos.bubble, top: hintPos.top }}
            >
              {/* the arrow, sitting under whichever chip it points at */}
              <motion.span
                aria-hidden="true"
                className="absolute -top-1.5 h-3 w-3 rotate-45 rounded-[2px] bg-forest-900"
                animate={{ left: hintPos.chip - hintPos.bubble - 6 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              />
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20" aria-hidden="true">
                <motion.svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#DCC28C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={reducedMotion ? undefined : { y: [0, -3, 0, 0], scale: [1, 1, 0.9, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.3, 0.55, 1] }}
                >
                  <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.8-2.4L3.6 15a1.5 1.5 0 0 1 2.4-1.8L9 16" />
                </motion.svg>
              </span>
              <span className="min-w-0">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={hintIndex}
                    className="block font-semibold text-gold-light"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {scenarios[hintIndex].chipLabel[lang]}
                  </motion.span>
                </AnimatePresence>
                <span className="block text-ivory/80">{ui.scenarioPrompt}</span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Message list */}
      {/* layoutScroll: the bubbles animate their layout inside this scrolling box,
          and without it framer measures them as if it never scrolled (gaps, clipped cards) */}
      <motion.div
        layoutScroll
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={ui.chatLabel}
        lang={langTag}
        className="flex flex-col gap-3 px-4 py-5 h-80 overflow-y-auto scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) =>
            msg.gate ? (
              <motion.div
                key={msg.id}
                layout
                initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.25 }}
                className={`relative w-full shrink-0 overflow-hidden rounded-2xl bg-forest-900 p-4 text-ivory shadow-lift ${bodyFont}`}
              >
                <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gold/20 blur-2xl" />
                <p className="relative font-display text-[1.05rem]">{ui.gateTitle}</p>
                <p className="relative mt-1 text-[13px] leading-relaxed text-ivory/75">{ui.gateBody}</p>
                <div className="relative mt-3 flex flex-wrap gap-2">
                  <a
                    href={SIGN_IN_HREF}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[13px] font-semibold text-forest-950 transition-colors hover:bg-gold-light"
                  >
                    {ui.signInCta}
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a
                    href={site.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-ivory/25 px-3.5 py-2 text-[13px] font-medium text-ivory transition-colors hover:bg-ivory/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d={WA_PATH} /></svg>
                    {ui.whatsappCta}
                  </a>
                </div>
                <a href={SIGN_UP_HREF} className="relative mt-2.5 inline-block text-[12px] text-ivory/60 underline-offset-2 hover:text-ivory hover:underline">
                  {ui.createAccount}
                </a>
              </motion.div>
            ) : (
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
            )
          )}
        </AnimatePresence>

        {typing && (
          <div className="self-start">
            <TypingDots />
          </div>
        )}
      </motion.div>

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

        {/* sign in / WhatsApp: the two ways to go from this preview to a real conversation */}
        <AnimatePresence mode="wait" initial={false}>
          {me === null && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 grid grid-cols-[1fr_auto] gap-2"
              lang={langTag}
            >
              <a
                href={SIGN_IN_HREF}
                className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-forest px-4 py-2.5 text-[13.5px] font-semibold text-ivory transition-colors hover:bg-forest-700 ${bodyFont}`}
              >
                {/* a slow shimmer across the button, so it reads as the way in */}
                {!reducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-ivory/15 to-transparent"
                    initial={{ left: "-40%" }}
                    animate={{ left: "140%" }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }}
                  />
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
                <span className="relative">{ui.signInCta}</span>
              </a>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Manu on WhatsApp"
                className="flex items-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3.5 py-2.5 text-[13.5px] font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/20"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d={WA_PATH} /></svg>
                <span className="hidden sm:inline">{ui.whatsappCta}</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 flex flex-col items-center gap-2">
          <p className={`text-xs text-ink/40 text-center ${bodyFont}`} lang={langTag}>
            {signedIn ? (
              <>
                {ui.liveNote}{" "}
                <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium text-[#128C4B] hover:underline">
                  {ui.whatsappCta} →
                </a>
              </>
            ) : (
              ui.previewNote
            )}
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
