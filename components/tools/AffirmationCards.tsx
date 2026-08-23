"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Rotating bilingual affirmation cards — Hindi first, English underneath.
 * Deck is shuffled once per visit so it opens on a different card each time.
 * Phrasings are deliberately gender-neutral.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Affirmation = { deva: string; en: string };

const deck: Affirmation[] = [
  { deva: "यह समय भी गुज़र जाएगा।", en: "This too shall pass." },
  { deva: "साँस है, तो राह है।", en: "As long as there's breath, there's a way." },
  { deva: "धीरे चलना भी चलना है।", en: "Moving slowly is still moving." },
  { deva: "आज बस आज है।", en: "Today only has to be today." },
  { deva: "मदद माँगना कमज़ोरी नहीं, समझदारी है।", en: "Asking for help isn't weakness — it's wisdom." },
  { deva: "मेरा मन मेरा दुश्मन नहीं।", en: "My mind is not my enemy." },
  { deva: "हर दिन एक नई शुरुआत है।", en: "Every day is a fresh start." },
  { deva: "जो महसूस हो रहा है, वह मान्य है।", en: "Whatever I'm feeling is allowed to be felt." },
  { deva: "आराम भी काम है।", en: "Rest is work too." },
  { deva: "मुझसे जितना हो सके, उतना काफ़ी है।", en: "Whatever I can manage today is enough." },
  { deva: "मैं अपने विचार नहीं हूँ।", en: "I am not my thoughts." },
  { deva: "टूटना बुरा नहीं — वहीं से रोशनी आती है।", en: "Breaking isn't the end — that's where the light gets in." },
  { deva: "अपने आप से वैसे बोलो, जैसे किसी अपने से बोलते हो।", en: "Speak to yourself the way you'd speak to someone you love." },
  { deva: "मन का ख़याल रखना भी सेहत है।", en: "Caring for the mind is health, too." },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AffirmationCards() {
  // shuffle only after mount (keeping the first card fixed) so the server
  // and client render the same opening card — no hydration mismatch
  const [cards, setCards] = useState(deck);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setCards([deck[0], ...shuffle(deck.slice(1))]);
  }, []);
  const card = cards[idx];

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <div className="relative flex min-h-[19rem] items-center justify-center rounded-3xl border border-forest-800/10 bg-forest-900 p-10 shadow-bloom sm:p-14">
        {/* soft glow behind the words */}
        <div
          className="absolute inset-0 rounded-3xl"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(200,164,93,0.14), transparent 70%)",
          }}
        />
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative z-10"
          >
            <p lang="hi" className="font-deva text-2xl leading-relaxed text-gold sm:text-3xl">
              {card.deva}
            </p>
            <p className="mt-5 font-display text-lg font-medium italic text-ivory/85 sm:text-xl">
              {card.en}
            </p>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          onClick={() => setIdx((i) => (i + 1) % cards.length)}
          className="rounded-full bg-forest-800 px-8 py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
        >
          Another one
        </button>
        <p className="text-sm tabular-nums text-ink/50">
          {idx + 1} / {cards.length}
        </p>
      </div>

      <p className="mx-auto mt-7 max-w-sm text-xs leading-relaxed text-ink/45">
        Read it once. Then read it again, slower — and let yourself believe it
        for just one breath.
      </p>
    </div>
  );
}
