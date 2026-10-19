"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextArea } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Feedback";

/**
 * Closing or reopening a client's account.
 *
 * Deliberately a two-step: the button opens a panel that states what will
 * happen and asks why, and only then will it block. An account closure on a
 * mental-health service is not a toggle, and a control that behaves like one
 * invites the mis-click it deserves.
 *
 * The upcoming-session count is passed in and shown in the panel, because what
 * blocking does NOT do is the part that gets forgotten: those sessions stay in
 * the practitioner's calendar until somebody deals with them.
 */
export default function BlockClient({
  clientId,
  name,
  blockedAt,
  blockedReason,
  blockedBy,
  upcoming,
}: {
  clientId: string;
  name: string;
  blockedAt: string | null;
  blockedReason: string | null;
  blockedBy: string | null;
  upcoming: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "block" | "unblock") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.fields?.reason || data.error || "That didn't work. Please try again.");
        return;
      }
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  if (blockedAt) {
    const when = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    }).format(new Date(blockedAt));
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
        <p className="font-display text-lg font-medium text-red-900">Account blocked</p>
        <p className="mt-1.5 text-[0.88rem] leading-relaxed text-red-900/80">
          Blocked on {when}
          {blockedBy ? ` by ${blockedBy}` : ""}. They cannot sign in or book. Nothing of theirs was
          deleted.
        </p>
        {blockedReason && (
          <p className="mt-3 rounded-xl bg-red-100/70 px-3.5 py-2.5 text-[0.86rem] leading-relaxed text-red-900">
            <span className="font-semibold">Reason:</span> {blockedReason}
            <span className="mt-1 block text-[0.78rem] text-red-900/70">
              Internal only — this was never shown to them.
            </span>
          </p>
        )}
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
        <button
          type="button"
          onClick={() => send("unblock")}
          disabled={busy}
          className="press mt-4 inline-flex items-center gap-2 rounded-full border border-red-300 bg-ivory px-5 py-2.5 text-[0.88rem] font-semibold text-red-900 transition-colors hover:border-red-500 disabled:opacity-50"
        >
          {busy && <Spinner />}
          Restore this account
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
      {!open ? (
        <>
          <p className="font-display text-lg font-medium text-forest-900">Account access</p>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink/70">
            {name.split(" ")[0]} can sign in and book normally.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="press mt-4 rounded-full border border-forest-800/20 px-5 py-2.5 text-[0.88rem] font-semibold text-forest-800 transition-colors hover:border-red-400 hover:text-red-800"
          >
            Block this account
          </button>
        </>
      ) : (
        <>
          <p className="font-display text-lg font-medium text-forest-900">
            Block {name.split(" ")[0]}?
          </p>
          <ul className="mt-3 space-y-2 text-[0.88rem] leading-relaxed text-ink/75">
            <li className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-hidden="true" />
              They can no longer sign in or book. Any session they have open ends on their next
              click.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              Nothing is deleted or refunded. Their bookings, payments and receipts stay as they
              are.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              {upcoming === 0 ? (
                "They have no upcoming sessions to deal with."
              ) : (
                <span>
                  <strong className="font-semibold text-forest-900">
                    {upcoming} upcoming {upcoming === 1 ? "session is" : "sessions are"} still in a
                    practitioner&apos;s calendar.
                  </strong>{" "}
                  Blocking does not cancel them — cancel each one below if that is what you want.
                </span>
              )}
            </li>
          </ul>

          <div className="mt-4">
            <TextArea
              label="Why"
              required
              value={reason}
              onChange={setReason}
              rows={3}
              maxLength={300}
              disabled={busy}
              placeholder="Abusive messages to a practitioner on 10 Oct; reported by…"
              hint="Kept on the record and in the Trail. Never shown to the client."
            />
          </div>

          {error && (
            <Alert tone="error" className="mt-4">
              {error}
            </Alert>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => send("block")}
              disabled={busy || !reason.trim()}
              className="press inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition-colors hover:bg-red-800 disabled:opacity-50"
            >
              {busy && <Spinner />}
              Block the account
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={busy}
              className="press rounded-full px-4 py-2.5 text-[0.88rem] font-medium text-ink/70 transition-colors hover:text-forest-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
