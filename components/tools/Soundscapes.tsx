"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Ambient soundscapes generated live with the Web Audio API — no audio files,
 * nothing to download, works offline. Rain and wind are shaped noise; the
 * river is brown noise; the tanpura is a softly detuned drone on Sa–Pa–Sa.
 * Sounds can be layered together, and an optional timer fades everything out.
 * Each tile carries a watercolor of the place its sound comes from.
 */

type SoundId = "rain" | "river" | "tanpura" | "wind";

type SoundDef = {
  id: SoundId;
  name: string;
  body: string;
  art: string;
  /** object-position so each painting shows its best part in a wide tile */
  artPos: string;
};

const sounds: SoundDef[] = [
  {
    id: "rain",
    name: "Monsoon rain",
    body: "Steady rainfall on a quiet afternoon",
    art: "/sounds/monsoon-rain.png",
    artPos: "object-[center_28%]",
  },
  {
    id: "river",
    name: "Flowing river",
    body: "Deep, low water moving past you",
    art: "/sounds/flowing-river.png",
    artPos: "object-center",
  },
  {
    id: "tanpura",
    name: "Tanpura drone",
    body: "A warm Sa–Pa–Sa hum, like riyaaz at dawn",
    art: "/sounds/tanpura.png",
    artPos: "object-[center_88%]",
  },
  {
    id: "wind",
    name: "Hill wind",
    body: "Air moving slowly through high trees",
    art: "/sounds/hill-wind.png",
    artPos: "object-[center_62%]",
  },
];

/* ------------------------------------------------------------------ */
/* audio graph builders — each returns the nodes feeding `out`         */
/* ------------------------------------------------------------------ */

function noiseBuffer(ctx: AudioContext, kind: "white" | "brown") {
  const len = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "white") {
      data[i] = white;
    } else {
      // leaky integrator: white noise random-walks into brown noise
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

function looped(ctx: AudioContext, buffer: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

type Voice = { start: () => void; nodes: AudioNode[] };

function buildRain(ctx: AudioContext, out: GainNode): Voice {
  const src = looped(ctx, noiseBuffer(ctx, "white"));
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 500;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3800;
  const g = ctx.createGain();
  g.gain.value = 0.5;
  src.connect(hp).connect(lp).connect(g).connect(out);
  return { start: () => src.start(), nodes: [src, hp, lp, g] };
}

function buildRiver(ctx: AudioContext, out: GainNode): Voice {
  const src = looped(ctx, noiseBuffer(ctx, "brown"));
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.value = 0.9;
  src.connect(lp).connect(g).connect(out);
  return { start: () => src.start(), nodes: [src, lp, g] };
}

function buildWind(ctx: AudioContext, out: GainNode): Voice {
  const src = looped(ctx, noiseBuffer(ctx, "white"));
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 500;
  bp.Q.value = 0.9;
  // a slow LFO sweeps the band up and down like gusts
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 280;
  lfo.connect(lfoGain).connect(bp.frequency);
  const g = ctx.createGain();
  g.gain.value = 0.55;
  src.connect(bp).connect(g).connect(out);
  return {
    start: () => {
      src.start();
      lfo.start();
    },
    nodes: [src, bp, lfo, lfoGain, g],
  };
}

function buildTanpura(ctx: AudioContext, out: GainNode): Voice {
  // Sa (C3), Pa (G3), Sa' (C4) — each "string" slightly detuned, breathing
  // at its own slow rate so the drone never sounds static
  const freqs = [130.81, 196.0, 261.63];
  const nodes: AudioNode[] = [];
  const starts: (() => void)[] = [];
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  const master = ctx.createGain();
  master.gain.value = 0.16;
  lp.connect(master).connect(out);
  nodes.push(lp, master);

  freqs.forEach((f, i) => {
    [-3, 3].forEach((cents) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      osc.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      // gentle amplitude wobble, different speed per string
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11 + i * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.18;
      lfo.connect(lfoGain).connect(g.gain);
      osc.connect(g).connect(lp);
      nodes.push(osc, g, lfo, lfoGain);
      starts.push(() => {
        osc.start();
        lfo.start();
      });
    });
  });

  return { start: () => starts.forEach((s) => s()), nodes };
}

const builders: Record<SoundId, (ctx: AudioContext, out: GainNode) => Voice> = {
  rain: buildRain,
  river: buildRiver,
  wind: buildWind,
  tanpura: buildTanpura,
};

/* ------------------------------------------------------------------ */

const TIMER_CHOICES = [5, 15, 30] as const;
const TIMER_FADE_SECS = 8;

export default function Soundscapes() {
  const [active, setActive] = useState<Set<SoundId>>(new Set());
  const [volume, setVolume] = useState(0.7);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [timerMins, setTimerMins] = useState<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const voicesRef = useRef<Map<SoundId, { voice: Voice; gain: GainNode }>>(new Map());
  const volumeRef = useRef(volume);

  const teardownVoice = useCallback((id: SoundId, fadeSecs = 0.6) => {
    const ctx = ctxRef.current;
    const entry = voicesRef.current.get(id);
    if (!ctx || !entry) return;
    entry.gain.gain.cancelScheduledValues(ctx.currentTime);
    entry.gain.gain.setValueAtTime(entry.gain.gain.value, ctx.currentTime);
    entry.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fadeSecs);
    const old = entry.voice.nodes;
    setTimeout(() => old.forEach((n) => n.disconnect()), fadeSecs * 1000 + 100);
    voicesRef.current.delete(id);
  }, []);

  const stopAll = useCallback(
    (fadeSecs = 0.6) => {
      for (const id of Array.from(voicesRef.current.keys())) teardownVoice(id, fadeSecs);
      setActive(new Set());
      // restore master volume for the next play after a timer fade
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        setTimeout(() => {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(Math.max(volumeRef.current, 0.0001), ctx.currentTime);
        }, fadeSecs * 1000 + 150);
      }
    },
    [teardownVoice]
  );

  const toggle = (id: SoundId) => {
    if (active.has(id)) {
      teardownVoice(id);
      setActive((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    void ctx.resume();

    const vGain = ctx.createGain();
    vGain.gain.value = 0.0001;
    vGain.connect(masterRef.current!);
    const voice = builders[id](ctx, vGain);
    voice.start();
    vGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
    voice.nodes.push(vGain);
    voicesRef.current.set(id, { voice, gain: vGain });
    setActive((prev) => new Set(prev).add(id));
  };

  const setTimer = (mins: number | null) => {
    setTimerMins(mins);
    setRemaining(mins === null ? null : mins * 60);
  };

  // countdown: tick once a second, fade the master near the end, then stop
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      stopAll(1);
      setRemaining(null);
      setTimerMins(null);
      return;
    }
    if (remaining === TIMER_FADE_SECS) {
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + TIMER_FADE_SECS);
      }
    }
    const t = setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [remaining, stopAll]);

  const changeVolume = (v: number) => {
    setVolume(v);
    volumeRef.current = v;
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(Math.max(v, 0.0001), ctx.currentTime + 0.1);
    }
  };

  // full cleanup when leaving the page
  useEffect(() => {
    return () => {
      if (ctxRef.current) void ctxRef.current.close();
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {sounds.map((s) => {
          const isActive = active.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              aria-pressed={isActive}
              className={cn(
                "card-lift group relative flex min-h-[11.5rem] flex-col justify-end overflow-hidden rounded-2xl border bg-ivory-light p-6 text-left transition-colors duration-300",
                isActive
                  ? "border-gold shadow-bloom"
                  : "border-forest-800/10 shadow-lift hover:border-forest-600/40"
              )}
            >
              {/* the watercolor, waking up when its sound plays */}
              <span className="absolute inset-0" aria-hidden="true">
                <Image
                  src={s.art}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 340px, 100vw"
                  className={cn(
                    "object-cover transition-all duration-700 ease-silk",
                    s.artPos,
                    isActive
                      ? "scale-105 opacity-100"
                      : "opacity-55 group-hover:scale-[1.03] group-hover:opacity-80"
                  )}
                />
                {/* ivory washes so the words stay quiet and readable */}
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(252,250,246,0.94) 0%, rgba(252,250,246,0.55) 42%, rgba(252,250,246,0.06) 78%)",
                  }}
                />
              </span>

              <span className="relative">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-lg font-medium text-forest-900">{s.name}</span>
                  {isActive && (
                    <span className="flex items-end gap-[3px]" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-[3px] animate-pulse rounded-full bg-gold-dark"
                          style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.25}s` }}
                        />
                      ))}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink/65">{s.body}</span>
                <span
                  className={cn(
                    "mt-3 block text-xs font-semibold uppercase tracking-[0.14em]",
                    isActive ? "text-gold-dark" : "text-forest-600/70"
                  )}
                >
                  {isActive ? "Playing — tap to remove" : "Tap to add"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* sleep timer */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-forest-600/80">
          Fade out after
        </span>
        <button
          onClick={() => setTimer(null)}
          aria-pressed={timerMins === null}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
            timerMins === null
              ? "border-forest-800 bg-forest-800 text-ivory"
              : "border-forest-800/20 text-forest-800 hover:border-forest-800"
          )}
        >
          Off
        </button>
        {TIMER_CHOICES.map((m) => (
          <button
            key={m}
            onClick={() => setTimer(m)}
            aria-pressed={timerMins === m}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold tabular-nums transition-colors",
              timerMins === m
                ? "border-forest-800 bg-forest-800 text-ivory"
                : "border-forest-800/20 text-forest-800 hover:border-forest-800"
            )}
          >
            {m} min
          </button>
        ))}
        {remaining !== null && (
          <span className="ml-1 text-xs tabular-nums text-ink/55" aria-live="polite">
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} left
          </span>
        )}
      </div>

      {/* volume */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-forest-600" aria-hidden="true">
          <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" strokeLinejoin="round" />
          <path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          aria-label="Volume"
          className="h-1.5 w-48 cursor-pointer appearance-none rounded-full bg-forest-800/15 accent-gold"
        />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink/45">
        Mix sounds together — rain over a tanpura drone is lovely. Generated
        live in your browser: nothing streams, nothing downloads. The timer
        fades everything out gently, perfect for falling asleep to.
      </p>
    </div>
  );
}
