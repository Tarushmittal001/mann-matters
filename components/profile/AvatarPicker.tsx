"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Spinner } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

/**
 * A client's picture: one of our watercolours, or one of their own.
 *
 * ── WHY A PLAIN <img> AND NOT next/image ───────────────────────────────────
 * An uploaded avatar is served by a route that checks the viewer's session.
 * The image optimiser fetches its source server-side, without that cookie, so
 * next/image would turn every uploaded photo into a 401. The watercolours
 * could be optimised, but using one element for both keeps the swap from
 * flickering between two different pipelines.
 *
 * ── WHY "YOUR OWN PHOTO" IS OFFERED HERE AND NOT ON A REVIEW ───────────────
 * This picture is yours: it shows on your own dashboard and to the
 * practitioner you book. A review is a public statement that you had therapy,
 * and a face attached to one is searchable forever by anyone who has the
 * photo. So reviews stay watercolours-only, on purpose, and this is the one
 * place where a real face is a reasonable thing to offer.
 */

type Stock = { src: string; label: string };

export default function AvatarPicker({
  initial,
  initials,
  stock,
}: {
  initial: string | null;
  initials: string;
  stock: Stock[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  /* One place where a result lands, so every path clears the error, stops the
     spinner, and keeps the server's answer rather than what we hoped for. */
  async function send(run: () => Promise<Response>) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await run();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.fields?.avatar || data.error || "That didn't save. Please try again.");
        return;
      }
      setAvatar(data.avatar ?? null);
      setSaved(true);
      // anywhere else showing it is server-rendered
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  const choose = (src: string | null) =>
    send(() =>
      fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: src }),
      })
    );

  function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    return send(() => fetch("/api/profile/avatar", { method: "POST", body }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-sage-light/50 ring-1 ring-forest-800/10">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Your picture" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl font-medium text-forest-800/70">
              {initials}
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-ivory/70">
              <Spinner />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-[0.9rem] leading-relaxed text-ink/70">
            Pick one of ours, or use a photo of your own. Only you and the therapist you book can
            see it — it never appears on a review.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              disabled={busy}
              className="press rounded-full border border-forest-800/20 px-4 py-2 text-[0.85rem] font-medium text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-50"
            >
              {open ? "Hide the portraits" : "Choose a portrait"}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="press rounded-full border border-forest-800/20 px-4 py-2 text-[0.85rem] font-medium text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-50"
            >
              Upload a photo
            </button>
            {avatar && (
              <button
                type="button"
                onClick={() => choose(null)}
                disabled={busy}
                className="press rounded-full px-3 py-2 text-[0.85rem] font-medium text-ink/60 underline underline-offset-2 transition-colors hover:text-forest-800 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // cleared first, so choosing the same file twice still fires
              e.target.value = "";
              if (file) void upload(file);
            }}
          />
          <p className="text-[0.78rem] text-ink/55">JPEG, PNG or WebP, up to 5 MB.</p>
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}
      {saved && !error && (
        <p className="mt-4 text-[0.85rem] font-medium text-forest-700" role="status">
          Saved.
        </p>
      )}

      {open && (
        <div className="mt-6 rounded-2xl border border-forest-800/10 bg-ivory-light p-4">
          {stock.length === 0 ? (
            <p className="py-4 text-center text-[0.88rem] text-ink/55">
              No portraits are available right now.
            </p>
          ) : (
            <ul className="grid max-h-80 grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-6">
              {stock.map((s) => {
                const active = avatar === s.src;
                return (
                  <li key={s.src}>
                    <button
                      type="button"
                      onClick={() => choose(active ? null : s.src)}
                      disabled={busy}
                      aria-pressed={active}
                      className={cn(
                        "press block aspect-square w-full overflow-hidden rounded-full ring-offset-2 ring-offset-ivory-light transition-shadow disabled:opacity-50",
                        active
                          ? "ring-2 ring-gold"
                          : "ring-1 ring-forest-800/10 hover:ring-forest-800/40"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.src} alt={s.label} className="h-full w-full object-cover" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
