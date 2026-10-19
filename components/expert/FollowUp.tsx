"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/expert/controls";

/**
 * Suggesting another session.
 *
 * It sends an invitation, never a booking. The client gets a link and a line
 * from you, and decides for themselves — which is why the button says
 * "suggest" and not "book", and why there is nothing here that would put a
 * session in somebody's calendar without them agreeing to it.
 */
export default function FollowUp({
  bookingId,
  clientName,
  already,
}: {
  bookingId: string;
  clientName: string;
  /** An unanswered suggestion already sent, if there is one. */
  already: { sentAt: string; message: string } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="text-[0.88rem] text-forest-700" role="status">
        Suggested. {clientName} has the link — it is theirs to take up or not.
      </p>
    );
  }

  if (already) {
    const when = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(already.sentAt));
    return (
      <div className="text-[0.88rem] leading-relaxed text-ink/70">
        <p>
          You suggested a follow-up on {when}
          {already.message ? ` — "${already.message}"` : ""}. They have not booked yet.
        </p>
        <p className="mt-1 text-[0.82rem] text-ink/55">
          You can suggest again after a week. Sooner than that is pressure, and this is the one
          place it would do real harm.
        </p>
      </div>
    );
  }

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/expert/sessions/${bookingId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "That didn't send.");
        return;
      }
      setSent(true);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Nothing was sent.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div>
        <p className="text-[0.88rem] leading-relaxed text-ink/70">
          Think {clientName} would benefit from another session? Send them a link. They decide.
        </p>
        <div className="mt-3">
          <ActionButton tone="secondary" size="sm" onClick={() => setOpen(true)}>
            Suggest a follow-up
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/70">
        A line from you
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={300}
          autoFocus
          disabled={busy}
          placeholder="Shall we keep the same time next week?"
          className="mt-1.5 w-full rounded-xl border border-forest-800/15 bg-ivory px-3.5 py-2.5 text-[0.9rem] font-normal normal-case tracking-normal leading-relaxed text-forest-900 focus:border-forest-800 focus:outline-none"
        />
      </label>
      <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink/60">
        Optional, and they will see it word for word. {clientName} gets a booking link — nothing is
        booked and nothing is charged.
      </p>

      {error && <p className="mt-2 text-[0.85rem] text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <ActionButton size="sm" onClick={send} busy={busy}>
          Send the suggestion
        </ActionButton>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
          className="text-[0.86rem] font-medium text-ink/60 transition-colors hover:text-forest-800 disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
