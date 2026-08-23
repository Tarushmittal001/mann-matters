"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useInView,
  AnimatePresence,
} from "framer-motion";

type Line = { from: "bot" | "user"; text: string; typing: number; pause: number };

/* The conversation that plays itself out, on loop */
const script: Line[] = [
  { from: "bot", text: "Mood aaj kaisa hai? 🌤️", typing: 900, pause: 900 },
  {
    from: "user",
    text: "honestly thoda overwhelmed, exams ka pressure hai",
    typing: 1300,
    pause: 700,
  },
  {
    from: "bot",
    text: "Samajh sakta hoon. Let’s slow it down — ek 60-second breathing exercise try karein? 🌬️",
    typing: 1500,
    pause: 800,
  },
  { from: "user", text: "haan, let’s do it", typing: 800, pause: 1200 },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ivory/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export default function WhatsAppChat() {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(reduce ? script.length : 0);
  const [typing, setTyping] = useState<"bot" | "user" | null>(null);
  const [badges, setBadges] = useState(reduce);

  // 3D tilt driven by pointer position
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const cardRef = useRef<HTMLDivElement>(null);

  // play the conversation once, the first time it scrolls into view
  const inView = useInView(cardRef, { once: true, margin: "-20% 0px" });

  function handleMove(e: React.PointerEvent) {
    if (reduce) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 16);
    rx.set(-py * 16);
  }
  function handleLeave() {
    rx.set(0);
    ry.set(0);
  }

  // Play the conversation once, when it first comes into view
  useEffect(() => {
    if (reduce || !inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const t = setTimeout(res, ms);
        timers.push(t);
      });

    async function run() {
      await wait(400);
      for (let i = 0; i < script.length; i++) {
        if (cancelled) return;
        setTyping(script[i].from);
        await wait(script[i].typing);
        if (cancelled) return;
        setTyping(null);
        setCount(i + 1);
        await wait(script[i].pause);
      }
      if (cancelled) return;
      setBadges(true);
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduce, inView]);

  return (
    <div
      style={{ perspective: 1100 }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="mx-auto w-full max-w-sm"
    >
      <motion.div
        ref={cardRef}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-forest-900 shadow-bloom"
      >
        {/* soft depth glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-[1.75rem] bg-gradient-to-br from-gold/10 via-transparent to-[#128C7E]/15"
          style={{ transform: "translateZ(-1px)" }}
        />

        {/* header */}
        <div
          className="flex items-center gap-3 bg-[#075E54] px-5 py-4"
          style={{ transform: "translateZ(50px)" }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 font-deva text-lg text-ivory" aria-hidden="true">
            मन
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">manu</p>
            <p className="flex items-center gap-1.5 text-[0.7rem] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              online · replies instantly
            </p>
          </div>
        </div>

        {/* messages — anchored to the bottom like a real chat */}
        <div
          className="flex min-h-[330px] flex-col justify-end gap-3 px-4 py-6 text-[0.9rem] leading-relaxed"
          style={{ transform: "translateZ(35px)" }}
        >
          <AnimatePresence initial={false}>
            {script.slice(0, count).map((m, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: EASE }}
                className={
                  m.from === "bot"
                    ? "max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-white/10 px-4 py-2.5 text-ivory/90 shadow-lg shadow-black/20"
                    : "max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-[#128C7E] px-4 py-2.5 text-white shadow-lg shadow-black/20"
                }
                style={{ transform: `translateZ(${20 + i * 6}px)` }}
              >
                {m.text}
              </motion.div>
            ))}

            {typing && (
              <motion.div
                key="typing"
                layout
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={
                  typing === "bot"
                    ? "self-start rounded-2xl rounded-tl-sm bg-white/10 px-4 py-2.5"
                    : "self-end rounded-2xl rounded-tr-sm bg-[#128C7E]/80 px-4 py-2.5"
                }
                style={{ transform: "translateZ(45px)" }}
              >
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>

          {/* badges pop in once the exchange lands */}
          <AnimatePresence>
            {badges && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="flex items-center gap-2 pt-1"
                style={{ transform: "translateZ(60px)" }}
              >
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.1 }}
                  className="rounded-full bg-gold/20 px-3 py-1 text-[0.7rem] font-medium text-gold-light"
                >
                  🔥 7-day streak
                </motion.span>
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.28 }}
                  className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-medium text-ivory/70"
                >
                  Bronze unlocked
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
