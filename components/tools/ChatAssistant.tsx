"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/lib/site";

/** A stateless on-site assistant. Crisis routing is enforced by the API before Claude. */

type Link2 = { label: string; href: string; external?: boolean };
type Msg = { from: "bot" | "user"; text: string; link?: Link2 };

const EASE = [0.22, 1, 0.36, 1] as const;

const quickReplies = [
  "How much does it cost?",
  "Which therapist is right for me?",
  "Is it confidential?",
  "I'm not feeling great",
];

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

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setMessages((m) => [...m, { from: "user", text: clean }]);
    setInput("");
    setTyping(true);
    let failureMessage = "I couldn't reply just now. You can try again, or talk to a real person on WhatsApp.";
    try {
      const response = await fetch("/api/manu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
      });
      const data = await response.json().catch(() => ({}));
      if (typeof data.error === "string") failureMessage = data.error;
      if (!response.ok || !data.reply?.text) throw new Error("Manu response unavailable");
      setMessages((messages) => [
        ...messages,
        { from: "bot", text: data.reply.text, link: data.reply.link },
      ]);
    } catch {
      setMessages((messages) => [
        ...messages,
        {
          from: "bot",
          text: failureMessage,
          link: { label: "Chat on WhatsApp", href: site.whatsapp, external: true },
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="support-launcher fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 sm:bottom-6 sm:left-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute bottom-16 left-0 flex h-[min(30rem,calc(100dvh-6rem))] w-[calc(100vw-2rem)] max-w-[22rem] flex-col overflow-hidden rounded-2xl border border-forest-800/10 bg-ivory-light shadow-bloom sm:w-[22rem]"
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
