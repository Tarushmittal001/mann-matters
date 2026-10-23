"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/expert/controls";
import { EMPTY_ITEM, MAX_ITEMS, looksRestricted, type RxItem } from "@/lib/prescriptions";
import { formatDateISO } from "@/lib/utils";

/**
 * Writing a prescription.
 *
 * Only rendered for a prescriber — and the route checks again, because a
 * component that is not rendered is not a security control.
 *
 * Drug, dose, frequency and duration are each their own field rather than one
 * free-text box, because those four are what make a line dispensable: a
 * pharmacist handed "Sertraline" and nothing else cannot fill it.
 */

type Issued = {
  id: string;
  number: string;
  issuedAt: string;
  items: RxItem[];
  cancelledAt: string | null;
};

export default function PrescriptionPad({
  bookingId,
  issued,
}: {
  bookingId: string;
  issued: Issued[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RxItem[]>([{ ...EMPTY_ITEM }]);
  const [advice, setAdvice] = useState("");
  const [followUpDays, setFollowUpDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (i: number, k: keyof RxItem, v: string) =>
    setItems((xs) => xs.map((x, n) => (n === i ? { ...x, [k]: v } : x)));

  const flagged = items.filter((i) => i.drug && looksRestricted(i.drug));
  const ready = items.every((i) => i.drug && i.dose && i.frequency && i.duration);

  async function issue() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/expert/sessions/${bookingId}/prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, advice, followUpDays: Number(followUpDays) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "That didn't go through.");
        return;
      }
      setNotice(
        data.delivered
          ? `${data.number} issued and sent. The patient has an email with a link to it.`
          : `${data.number} issued. The email didn't go, but it is on the patient's dashboard.`
      );
      setOpen(false);
      setItems([{ ...EMPTY_ITEM }]);
      setAdvice("");
      setFollowUpDays("");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Nothing was issued.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(prescriptionId: string) {
    const reason = window.prompt("Why are you withdrawing this prescription?")?.trim();
    if (!reason || reason.length < 4) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/expert/sessions/${bookingId}/prescription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId, reason }),
      });
      if (res.ok) router.refresh();
      else setError((await res.json().catch(() => ({}))).error || "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  const field = (
    i: number,
    k: keyof RxItem,
    label: string,
    placeholder: string,
    wide = false
  ) => (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="block text-[0.75rem] uppercase tracking-[0.12em] text-ink/70">{label}</span>
      <input
        value={items[i][k]}
        onChange={(e) => set(i, k, e.target.value)}
        disabled={busy}
        placeholder={placeholder}
        maxLength={200}
        className="mt-1 w-full rounded-lg border border-forest-800/15 bg-ivory px-2.5 py-1.5 text-[0.88rem] text-forest-900 focus:border-forest-800 focus:outline-none"
      />
    </label>
  );

  return (
    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
      {notice && (
        <p role="status" className="mb-3 text-[0.84rem] text-forest-700">
          {notice}
        </p>
      )}
      {issued.length > 0 && (
        <ul className="mb-4 space-y-2">
          {issued.map((rx) => (
            <li
              key={rx.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-forest-800/10 bg-ivory px-3.5 py-2.5"
            >
              <span className="min-w-0">
                <Link
                  href={`/prescription/${rx.id}`}
                  className="link-draw font-mono text-[0.8rem] font-medium text-forest-800"
                >
                  {rx.number}
                </Link>
                <span className="ml-2 text-[0.84rem] text-ink/70">
                  {rx.items.map((i) => i.drug).join(", ")}
                </span>
              </span>
              <span className="shrink-0 text-[0.8rem] text-ink/70">
                {rx.cancelledAt ? (
                  <span className="font-semibold text-red-700">Withdrawn</span>
                ) : (
                  <>
                    {formatDateISO(rx.issuedAt.slice(0, 10))}
                    <button
                      type="button"
                      onClick={() => withdraw(rx.id)}
                      disabled={busy}
                      className="ml-2.5 underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
                    >
                      withdraw
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <ActionButton tone="secondary" size="sm" onClick={() => setOpen(true)}>
          Write a prescription
        </ActionButton>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((_, i) => (
              <li key={i} className="rounded-xl border border-forest-800/10 bg-ivory-light p-3.5">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {field(i, "drug", "Medicine", "Sertraline")}
                  {field(i, "strength", "Strength", "50 mg")}
                  {field(i, "dose", "Dose", "1 tablet")}
                  {field(i, "frequency", "How often", "Once daily, morning")}
                  {field(i, "duration", "For how long", "4 weeks")}
                  {field(i, "instructions", "Instructions", "After food")}
                </div>
                {items[i].drug && looksRestricted(items[i].drug) && (
                  <p className="mt-2.5 rounded-lg bg-haldi/15 px-3 py-2 text-[0.8rem] leading-relaxed text-haldi-ink">
                    <strong>{items[i].drug}</strong> looks like a drug the Telemedicine Practice
                    Guidelines restrict — Schedule X and NDPS medicines cannot be prescribed on a
                    teleconsultation alone. You know your patient and the law; this is a flag, not
                    a block.
                  </p>
                )}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((xs) => xs.filter((_, n) => n !== i))}
                    disabled={busy}
                    className="mt-2 text-[0.8rem] text-ink/70 underline underline-offset-2 hover:text-red-700"
                  >
                    remove
                  </button>
                )}
              </li>
            ))}
          </ul>

          {items.length < MAX_ITEMS && (
            <button
              type="button"
              onClick={() => setItems((xs) => [...xs, { ...EMPTY_ITEM }])}
              disabled={busy}
              className="link-draw mt-3 text-[0.86rem] font-medium text-forest-700"
            >
              + another medicine
            </button>
          )}

          <label className="mt-4 block">
            <span className="block text-[0.75rem] uppercase tracking-[0.12em] text-ink/70">
              Advice (optional)
            </span>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              rows={2}
              maxLength={1000}
              disabled={busy}
              placeholder="Anything that is not a medicine — sleep, what to watch for."
              className="mt-1 w-full rounded-lg border border-forest-800/15 bg-ivory px-3 py-2 text-[0.88rem] leading-relaxed text-forest-900 focus:border-forest-800 focus:outline-none"
            />
          </label>

          <label className="mt-3 block text-[0.75rem] uppercase tracking-[0.12em] text-ink/70">
            Review in (days, 0 for none)
            <input
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value.replace(/\D/g, "").slice(0, 3))}
              inputMode="numeric"
              disabled={busy}
              placeholder="28"
              className="ml-2 w-20 rounded-lg border border-forest-800/15 bg-ivory px-2.5 py-1.5 text-[0.88rem] tracking-normal text-forest-900 focus:border-forest-800 focus:outline-none"
            />
          </label>

          <p className="mt-4 rounded-lg bg-forest-800/[0.04] px-3 py-2.5 text-[0.78rem] leading-relaxed text-ink/70">
            Issued in your name, with your registration number, and it cannot be edited afterwards
            — a mistake is withdrawn and replaced. Nothing here is checked against a drug database:{" "}
            <strong>a medicine with no warning has not been cleared by anything.</strong>
          </p>

          {flagged.length > 0 && (
            <p className="mt-2 text-[0.82rem] font-medium text-haldi-ink">
              {flagged.length} flagged {flagged.length === 1 ? "medicine" : "medicines"} above.
            </p>
          )}
          {error && <p className="mt-2 text-[0.85rem] text-red-700">{error}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <ActionButton size="sm" onClick={issue} busy={busy} disabled={!ready}>
              Issue and send to patient
            </ActionButton>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={busy}
              className="text-[0.86rem] font-medium text-ink/70 transition-colors hover:text-forest-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
