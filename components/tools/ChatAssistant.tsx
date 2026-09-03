"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/lib/site";

/**
 * A lightweight, rule-based on-site assistant — a working web counterpart to the
 * WhatsApp bot. It answers common questions, routes to the right tool, and puts
 * crisis support first. No backend, no data leaves the page.
 */

type Link2 = { label: string; href: string; external?: boolean };
type Msg = { from: "bot" | "user"; text: string; link?: Link2 };

const EASE = [0.22, 1, 0.36, 1] as const;

const quickReplies = [
  "How much does it cost?",
  "Which therapist is right for me?",
  "Is it confidential?",
  "I'm not feeling great",
];

function respond(input: string): { text: string; link?: Link2 } {
  const t = input.toLowerCase();
  const has = (...ks: string[]) => ks.some((k) => t.includes(k));

  // safety first
  if (has("suicid", "kill myself", "end it", "self harm", "self-harm", "harm myself", "hurt myself", "want to die", "don't want to live", "no reason to live")) {
    return {
      text: "I'm really glad you said something, and I want you to be safe. Please don't go through this alone — Tele-MANAS (14416) is free, confidential, and answered 24x7. If you're in immediate danger, call 112. You matter.",
      link: { label: "Open crisis support", href: "/crisis?sos=true" },
    };
  }
  if (has("emergency", "crisis")) {
    return { text: "If this is urgent, the fastest help is Tele-MANAS at 14416 — free and 24x7. Here's our crisis page with more options.", link: { label: "Crisis support", href: "/crisis?sos=true" } };
  }
  if (has("cost", "price", "fee", "charge", "how much", "₹", "rupee", "afford")) {
    return { text: "Sessions start at ₹599 for students, ₹999 for individual therapy, ₹399 for groups, and ₹1,499 for couples. You always see the exact price before booking — no subscriptions or hidden charges.", link: { label: "See services & pricing", href: "/services" } };
  }
  if (has("confidential", "private", "privacy", "anonymous", "data", "secure")) {
    return { text: "Completely confidential. What you share stays between you and your therapist — never shared with family or employers. Your data stays encrypted, on Indian servers. The only exception is serious, immediate risk to safety." };
  }
  if (has("language", "hindi", "tamil", "marathi", "telugu", "bengali", "kannada", "malayalam", "urdu", "gujarati")) {
    return { text: "Yes — you can have therapy in your own language. Our psychologists work in Hindi, English and several Indian languages, and you can switch mid-sentence. You can filter by language when you choose." };
  }
  if (has("book", "appointment", "schedule", "slot", "session time")) {
    return { text: "Booking takes about two minutes: pick a therapist, choose a time (8am–9pm, evenings and weekends too), and you get a private video link. Free reschedule with a day's notice.", link: { label: "Book a session", href: "/book" } };
  }
  if (has("which therapist", "recommend", "match", "right for me", "best therapist", "choose")) {
    return { text: "I can help you find a good fit. Our quick matcher asks about your concern, language, and budget, then suggests a therapist.", link: { label: "Find your therapist", href: "/match" } };
  }
  if (has("qualified", "licensed", "credential", "rci", "trained", "real therapist")) {
    return { text: "Every therapist holds a master's or higher in clinical or counselling psychology, and we verify licences (including RCI registration) and supervised experience before they see anyone. Their qualifications are on each profile." };
  }
  if (has("online", "video", "how does it work", "how it works", "app", "download")) {
    return { text: "Sessions are online over a private video link — no app to download. Open it on any phone or laptop at your session time. Most people forget the screen about ten minutes in." };
  }
  if (has("mood", "check in", "check-in", "how am i", "assessment", "quiz")) {
    return { text: "There's a gentle 2-minute check-in that reflects back how you might be doing and suggests a next step.", link: { label: "Take the check-in", href: "/check-in" } };
  }
  if (has("breath", "calm", "anxious now", "panic", "overwhelm", "stressed right now", "ground")) {
    return { text: "Let's slow things down together. Try a one-minute guided breathing exercise — in for four, hold, out for four.", link: { label: "Start breathing", href: "/breathe" } };
  }
  if (has("hi", "hello", "hey", "namaste", "help")) {
    return { text: "Hi! I'm here to help you find your footing. You can ask about pricing, languages, how sessions work, or tell me how you're feeling. What's on your mind?" };
  }
  return {
    text: "I might not have caught that. I can help with pricing, languages, booking, confidentiality, or finding the right therapist. Or chat with a real person on WhatsApp.",
    link: { label: "Chat on WhatsApp", href: site.whatsapp, external: true },
  };
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Hi, I'm the Emoraa companion 🌿 Ask me anything — or tell me how you're feeling." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [...m, { from: "user", text: clean }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const r = respond(clean);
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text: r.text, link: r.link }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute bottom-16 left-0 flex h-[30rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-bloom"
          >
            {/* header */}
            <div className="flex items-center gap-3 bg-forest-900 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 font-deva text-base text-ivory" aria-hidden="true">मन</span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ivory">Emoraa companion</p>
                <p className="text-[0.7rem] text-sage-light/70">Replies instantly · not a crisis line</p>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[0.88rem]">
              {messages.map((m, i) => (
                <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.from === "user"
                        ? "max-w-[82%] rounded-2xl rounded-tr-sm bg-forest-700 px-3.5 py-2.5 text-ivory"
                        : "max-w-[85%] rounded-2xl rounded-tl-sm bg-sage-light/40 px-3.5 py-2.5 text-forest-900"
                    }
                  >
                    {m.text}
                    {m.link &&
                      (m.link.external ? (
                        <a href={m.link.href} target="_blank" rel="noopener noreferrer" className="mt-2 block font-semibold text-gold-dark underline underline-offset-4">
                          {m.link.label} →
                        </a>
                      ) : (
                        <Link href={m.link.href} onClick={() => setOpen(false)} className="mt-2 block font-semibold text-gold-dark underline underline-offset-4">
                          {m.link.label} →
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-sage-light/40 px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-forest-700/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }} />
                    ))}
                  </div>
                </div>
              )}

              {/* quick replies (only before the first user message) */}
              {messages.length === 1 && !typing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickReplies.map((q) => (
                    <button key={q} onClick={() => send(q)} className="rounded-full border border-forest-800/15 bg-ivory px-3 py-1.5 text-[0.78rem] text-forest-700 transition-colors hover:border-forest-600 hover:bg-sage-light/30">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-forest-800/10 bg-ivory px-3 py-3"
            >
              <label htmlFor="assistant-input" className="sr-only">Type your message</label>
              <input
                id="assistant-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="w-full rounded-full border border-forest-800/15 bg-ivory-light px-4 py-2.5 text-sm text-forest-900 placeholder:text-ink/40 focus:border-gold focus:outline-none"
              />
              <button type="submit" aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-800 text-ivory transition-colors hover:bg-forest-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-800 text-ivory shadow-bloom transition-all duration-300 ease-silk hover:-translate-y-1 hover:bg-forest-700"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.2 }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" strokeLinejoin="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
