"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Every write in the portal ends here. A change the practitioner cannot see
 * land is a change they will make twice, so each mutation pushes one toast —
 * announced to screen readers through a polite live region, dismissible from
 * the keyboard, and never the only confirmation (forms also stamp their own
 * "saved at" line).
 */

type Tone = "success" | "error" | "info";

type Toast = { id: number; tone: Tone; title: string; detail?: string };

type ToastApi = {
  toast: (t: { tone?: Tone; title: string; detail?: string }) => void;
  saved: (title: string, detail?: string) => void;
  failed: (title: string, detail?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const TONES: Record<Tone, { ring: string; icon: string; label: string }> = {
  success: { ring: "border-mor/35 bg-mor/[0.07]", icon: "text-mor-ink", label: "Success" },
  error: { ring: "border-red-300 bg-red-50", icon: "text-red-700", label: "Error" },
  info: { ring: "border-forest-800/20 bg-ivory-light", icon: "text-forest-700", label: "Update" },
};

function Icon({ tone }: { tone: Tone }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
      {tone === "success" ? (
        <path d="M4 10.5 8 14.5 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : tone === "error" ? (
        <>
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 6.2v5m0 2.6h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 9v5m0-8.2h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, toast.tone === "error" ? 9000 : 5500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  const tone = TONES[toast.tone];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-bloom backdrop-blur-sm sm:w-[22rem]",
        tone.ring
      )}
    >
      <span className={tone.icon}>
        <Icon tone={toast.tone} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-forest-900">{toast.title}</p>
        {toast.detail && <p className="mt-0.5 text-[0.82rem] leading-snug text-ink/70">{toast.detail}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="-mr-1 -mt-1 rounded-full p-1.5 text-ink/45 transition-colors hover:bg-forest-800/[0.06] hover:text-forest-900"
        aria-label={"Dismiss: " + toast.title}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => {
    const push = (t: { tone?: Tone; title: string; detail?: string }) =>
      setToasts((all) => [...all.slice(-2), { id: Date.now() + Math.random(), tone: t.tone ?? "info", ...t }]);
    return {
      toast: push,
      saved: (title, detail) => push({ tone: "success", title, detail }),
      failed: (title, detail) => push({ tone: "error", title, detail }),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2.5 px-4 pb-6 sm:items-end sm:px-6"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
