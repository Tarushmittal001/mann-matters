"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A gentle BMI calculator. Uses the WHO Asia-Pacific cutoffs (healthy range
 * 18.5–22.9), which fit Indian bodies better than the Western scale — and
 * frames the result as a screening number, never a verdict. Nothing entered
 * here is stored or sent anywhere.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type Band = {
  label: string;
  note: string;
  /** upper bound, exclusive; the last band is open-ended */
  max: number;
};

// WHO Asia-Pacific classification
const bands: Band[] = [
  {
    max: 18.5,
    label: "A little under the typical range",
    note: "If this wasn't intentional — or eating has felt complicated lately — it's worth mentioning to a doctor. Gently, not urgently.",
  },
  {
    max: 23,
    label: "Within the typical range",
    note: "By this one blunt measure, your body is where the charts expect it. How you actually feel — sleep, energy, mood — matters far more than this number.",
  },
  {
    max: 25,
    label: "A little above the typical range",
    note: "By the Asian-population cutoffs this is slightly above typical. Small, kind changes — a walk, better sleep, less stress — move this more than punishing routines do.",
  },
  {
    max: Infinity,
    label: "Above the typical range",
    note: "A number like this is a nudge to check in with a doctor — not a judgment. Weight is shaped by stress, sleep, medication, and genetics, not just willpower.",
  },
];

const GAUGE_MIN = 15;
const GAUGE_MAX = 32;

function bandFor(bmi: number) {
  return bands.find((b) => bmi < b.max) ?? bands[bands.length - 1];
}

export default function BmiCalculator() {
  const [unit, setUnit] = useState<"cm" | "ftin">("cm");
  const [cm, setCm] = useState("");
  const [ft, setFt] = useState("");
  const [inch, setInch] = useState("");
  const [kg, setKg] = useState("");

  const heightM =
    unit === "cm"
      ? parseFloat(cm) / 100
      : ((parseFloat(ft) || 0) * 12 + (parseFloat(inch) || 0)) * 0.0254;
  const weightKg = parseFloat(kg);

  const valid =
    Number.isFinite(heightM) &&
    heightM >= 0.9 &&
    heightM <= 2.5 &&
    Number.isFinite(weightKg) &&
    weightKg >= 20 &&
    weightKg <= 300;

  const bmi = valid ? weightKg / (heightM * heightM) : null;
  const band = bmi !== null ? bandFor(bmi) : null;
  const markerPct =
    bmi !== null
      ? Math.min(100, Math.max(0, ((bmi - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100))
      : 0;

  const inputCls =
    "w-full rounded-2xl border border-forest-800/15 bg-ivory px-5 py-3.5 text-[0.98rem] text-forest-900 placeholder:text-ink/35 focus:border-forest-600 focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-forest-800/10 bg-ivory-light p-8 shadow-lift sm:p-10">
      {/* height */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
          Your height
        </label>
        <div className="flex gap-2">
          {(["cm", "ftin"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                unit === u
                  ? "border-forest-800 bg-forest-800 text-ivory"
                  : "border-forest-800/20 text-forest-800 hover:border-forest-800"
              )}
            >
              {u === "cm" ? "cm" : "ft + in"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        {unit === "cm" ? (
          <input
            type="number"
            inputMode="decimal"
            min={90}
            max={250}
            value={cm}
            onChange={(e) => setCm(e.target.value)}
            placeholder="e.g. 165"
            aria-label="Height in centimetres"
            className={inputCls}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={3}
              max={8}
              value={ft}
              onChange={(e) => setFt(e.target.value)}
              placeholder="feet, e.g. 5"
              aria-label="Height, feet part"
              className={inputCls}
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={11}
              value={inch}
              onChange={(e) => setInch(e.target.value)}
              placeholder="inches, e.g. 6"
              aria-label="Height, inches part"
              className={inputCls}
            />
          </div>
        )}
      </div>

      {/* weight */}
      <label className="mt-7 block text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
        Your weight
      </label>
      <div className="relative mt-3">
        <input
          type="number"
          inputMode="decimal"
          min={20}
          max={300}
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          placeholder="e.g. 62"
          aria-label="Weight in kilograms"
          className={inputCls}
        />
        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-ink/40">
          kg
        </span>
      </div>

      {/* result */}
      {bmi !== null && band !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-9 border-t border-forest-800/10 pt-8"
        >
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-display text-5xl font-medium text-forest-900">
              {bmi.toFixed(1)}
            </p>
            <p className="text-right text-sm font-semibold text-forest-700">{band.label}</p>
          </div>

          {/* the scale, marked without alarm */}
          <div className="mt-6" aria-hidden="true">
            <div className="relative h-2 overflow-hidden rounded-full">
              <div className="absolute inset-0 flex">
                <div className="bg-sage-light" style={{ width: `${((18.5 - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100}%` }} />
                <div className="bg-sage" style={{ width: `${((23 - 18.5) / (GAUGE_MAX - GAUGE_MIN)) * 100}%` }} />
                <div className="bg-gold-light" style={{ width: `${((25 - 23) / (GAUGE_MAX - GAUGE_MIN)) * 100}%` }} />
                <div className="flex-1 bg-gold" />
              </div>
            </div>
            <div className="relative mt-[-13px] h-4">
              <div
                className="absolute top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-ivory-light bg-forest-800 shadow-lift transition-[left] duration-700 ease-silk"
                style={{ left: `${markerPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink/40">
              <span>{GAUGE_MIN}</span>
              <span>18.5</span>
              <span>23</span>
              <span>25</span>
              <span>{GAUGE_MAX}+</span>
            </div>
          </div>

          <p className="mt-5 text-[0.95rem] leading-relaxed text-ink/70">{band.note}</p>
        </motion.div>
      ) : (
        <p className="mt-8 text-center text-sm text-ink/45">
          Fill in both and your number appears here — it never leaves this page.
        </p>
      )}

      <div className="mt-8 rounded-2xl bg-sage-light/40 p-5">
        <p className="text-xs leading-relaxed text-ink/60">
          <strong className="font-semibold text-forest-800">A number, not a verdict.</strong>{" "}
          BMI can&apos;t see muscle, bone, frame, or your story — it&apos;s a
          rough screening tool using WHO Asia-Pacific cutoffs, not medical
          advice. And if thoughts about food, weight, or your body have been
          feeling heavy lately, that&apos;s worth talking about —{" "}
          <Link href="/match" className="font-semibold text-forest-800 underline decoration-gold underline-offset-2">
            we know people who listen
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
