"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scenarios, type Message } from "./scenarios";
import TypingDots from "./TypingDots";

type DisplayMessage = Message & { id: string };

const TYPING_DELAY = 900;
const MESSAGE_GAP = 400;
const CANNED_REPLY =
  "Main yahin hoon. Sign in karke poori baat karein?";

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
  const tokenRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const playThread = useCallback(
    async (thread: Message[]) => {
      const token = ++tokenRef.current;
      setMessages([]);
      setTyping(false);

      for (const msg of thread) {
        if (tokenRef.current !== token) return;

        if (msg.role === "manu" && !reducedMotion) {
          setTyping(true);
          scrollToBottom();
          await new Promise((r) => setTimeout(r, TYPING_DELAY));
          if (tokenRef.current !== token) return;
          setTyping(false);
        }

        setMessages((prev) => [...prev, { ...msg, id: makeId() }]);
        scrollToBottom();

        if (!reducedMotion) {
          await new Promise((r) => setTimeout(r, MESSAGE_GAP));
        }
      }
    },
    [reducedMotion, scrollToBottom],
  );

  useEffect(() => {
    playThread(scenarios[0].thread);
    return () => {
      ++tokenRef.current;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectScenario = (id: string) => {
    setActiveScenario(id);
    const s = scenarios.find((sc) => sc.id === id);
    if (s) playThread(s.thread);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text, id: makeId() }]);
    scrollToBottom();

    if (liveMode) {
      setTyping(true);
      scrollToBottom();
      try {
        const res = await fetch("/api/manu-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "manu", text: data.reply ?? CANNED_REPLY, id: makeId() },
        ]);
      } catch {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "manu", text: CANNED_REPLY, id: makeId() },
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
      { role: "manu", text: CANNED_REPLY, id: makeId() },
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

      {/* Scenario chips */}
      <div
        className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-sage/10 scrollbar-none"
        role="tablist"
        aria-label="Conversation scenarios"
      >
        {scenarios.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={activeScenario === s.id}
            onClick={() => selectScenario(s.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-sans transition-all whitespace-nowrap ${
              activeScenario === s.id
                ? "bg-forest text-ivory shadow-lift"
                : "bg-sage/15 text-forest-700 hover:bg-sage/30"
            }`}
          >
            {s.chipLabel}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex flex-col gap-3 px-4 py-5 h-80 overflow-y-auto scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              {...bubbleVariants}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed font-sans ${
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
            placeholder="Apne mann ki baat likho…"
            className="flex-1 rounded-xl bg-ivory px-4 py-2.5 text-sm text-forest-900 placeholder:text-ink/40 border border-sage/20 focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-colors"
            aria-label="Type a message to Manu"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-forest-950 hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M2.94 4.34a1 1 0 0 1 1.34-.47L17.7 9.53a1 1 0 0 1 0 1.79l-13.42 5.66a1 1 0 0 1-1.38-1.13l1.5-5.1a.5.5 0 0 0 0-.28l-1.5-5.1a1 1 0 0 1 .04-.63Z" />
            </svg>
          </button>
        </form>

        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-xs text-ink/40 text-center font-sans">
            This is a preview. Manu remembers more once you sign&nbsp;in.
          </p>
          {!embedded && (
            <button
              onClick={onTryLive ?? (() => (window.location.href = "/manu"))}
              className="rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-forest-700 transition-colors"
            >
              Try Manu live — no sign-up →
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
