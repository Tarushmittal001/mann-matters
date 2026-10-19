import type { Metadata } from "next";
import { ACTION_LABEL, DESTRUCTIVE, recentEvents } from "@/lib/audit";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Trail | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Everything an admin has done, newest first.
 *
 * The reason this screen exists is not suspicion. It is that an admin can hide
 * a listing, revoke a practitioner's login or delete a discount code, and with
 * more than one admin those acts become anonymous — "who hid Dr. Shah?" turns
 * into a conversation nobody can settle. A trail turns it into a lookup.
 *
 * It holds administrative acts only. No session note, no intake answer and no
 * feedback text is copied here, because this page is read by people who are
 * not the client's practitioner.
 */

/** "2 Oct 2026, 7:14 pm" in clinic time, which is the only time ops thinks in. */
function when(at: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(at);
}

export default async function AdminAuditPage() {
  const events = await recentEvents(200);

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">accountability</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Trail</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        Every administrative action, with who did it and when. Clinical records are not in here and
        never will be — this page shows what was done to listings, logins and codes, not what anyone
        said in a session.
      </p>

      {events.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-forest-800/20 p-10 text-center">
          <p className="font-display text-lg text-forest-900">Nothing recorded yet.</p>
          <p className="mt-2 text-[0.92rem] text-ink/70">
            Actions taken from the admin screens will appear here from now on. Anything done before
            today is not in the trail — it was not being kept.
          </p>
        </div>
      ) : (
        <ol className="mt-10 space-y-2.5">
          {events.map((e) => {
            const destructive = DESTRUCTIVE.has(e.action);
            return (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 rounded-2xl border border-forest-800/10 bg-ivory-light px-5 py-4 shadow-lift"
              >
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    destructive ? "bg-red-50 text-red-700" : "bg-sage-light/70 text-forest-800"
                  )}
                >
                  {ACTION_LABEL[e.action] ?? e.action}
                </span>
                <span className="min-w-0 flex-1 text-[0.95rem] text-forest-900">{e.summary}</span>
                <span className="text-[0.82rem] text-ink/70">{e.actorEmail}</span>
                <span className="whitespace-nowrap text-[0.82rem] text-ink/70">{when(e.at)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {events.length >= 200 && (
        <p className="mt-6 text-[0.85rem] text-ink/70">
          Showing the most recent 200 actions.
        </p>
      )}
    </section>
  );
}
