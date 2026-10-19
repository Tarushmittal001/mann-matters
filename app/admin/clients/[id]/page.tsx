import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlockClient from "@/components/admin/BlockClient";
import RefundButton from "@/components/admin/RefundButton";
import { getClient } from "@/lib/admin-clients";
import { BOOKING_LABEL, PAYMENT_LABEL, TONE_CLASS, describe } from "@/lib/admin-status";
import { refundableAmount } from "@/lib/features/booking/policy";
import { initialsOf } from "@/lib/expert-portal";
import { cn, formatDateISO, formatINR } from "@/lib/utils";
import { currentAge } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Client | Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * One client, whole.
 *
 * The page to be looking at before deciding anything about somebody. It
 * carries what they booked, what they paid and what they missed — and NOT
 * their note to their therapist or their intake form, which are clinical and
 * belong to them and the person they booked.
 */

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bad" }) {
  return (
    <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-4">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/45">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-2xl font-medium",
          tone === "bad" ? "text-red-700" : "text-forest-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: keyof typeof TONE_CLASS }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[0.72rem] font-semibold",
        TONE_CLASS[tone]
      )}
    >
      {label}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-[0.92rem] text-forest-900">{children}</dd>
    </div>
  );
}

const none = <span className="text-ink/45">Not given</span>;

export default async function AdminClientPage({ params }: { params: { id: string } }) {
  const c = await getClient(params.id);
  if (!c) notFound();

  const joined = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(c.createdAt);

  return (
    <section className="wrap-wide pb-28">
      <Link href="/admin/clients" className="link-draw text-sm font-medium text-forest-700">
        ← All clients
      </Link>

      <div className="mt-6 flex flex-wrap items-start gap-5">
        {/* a plain <img>: an uploaded avatar is served by a route that checks
            the viewer, and next/image's optimiser fetches without the cookie */}
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sage-light/60">
          {c.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-xl font-semibold text-forest-800/70">
              {initialsOf(c.name)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="h-display text-3xl md:text-4xl">{c.name}</h1>
            {c.blockedAt && <Chip label="Blocked" tone="bad" />}
          </div>
          <p className="mt-1.5 break-all text-[0.95rem] text-ink/70">
            {c.email}
            {!c.emailVerified && <span className="ml-2 text-gold-dark">unconfirmed</span>}
          </p>
          <p className="mt-0.5 text-[0.88rem] text-ink/60">With us since {joined}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12">
        <div className="min-w-0 space-y-10">
          <div className="grid gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <Stat label="Sessions" value={String(c.totals.attended)} />
            <Stat label="Spent" value={formatINR(c.totals.spent)} />
            <Stat
              label="No-shows"
              value={String(c.totals.noShows)}
              tone={c.totals.noShows > 0 ? "bad" : undefined}
            />
            <Stat label="Cancelled" value={String(c.totals.cancelled)} />
          </div>

          <section>
            <h2 className="font-display text-2xl font-medium text-forest-900">
              Every booking
              <span className="ml-2 text-base font-normal text-ink/50">{c.bookings.length}</span>
            </h2>
            {c.bookings.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 p-10 text-center text-ink/65">
                They have never booked a session.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-forest-800/10 bg-ivory-light">
                <table className="w-full min-w-[50rem] border-collapse text-[0.9rem]">
                  <caption className="sr-only">
                    Every booking {c.name} has made, newest first
                  </caption>
                  <thead>
                    <tr className="border-b border-forest-800/10 text-left">
                      {["When", "With", "For", "Session", "Payment", "Amount", ""].map((h, i) => (
                        <th
                          key={h || "actions"}
                          className={cn(
                            "px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/60",
                            i === 5 && "text-right"
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.bookings.map((b) => {
                      const session = describe(BOOKING_LABEL, b.status);
                      const pay = b.payment
                        ? describe(PAYMENT_LABEL, b.payment.status)
                        : { label: "None", tone: "mute" as const };
                      return (
                        <tr key={b.id} className="border-b border-forest-800/[0.06] last:border-0">
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="text-forest-900">{formatDateISO(b.date)}</span>
                            <span className="ml-2 text-ink/60">{b.time}</span>
                            <span className="mt-0.5 block font-mono text-[0.72rem] text-ink/45">
                              {b.ref}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ink/75">{b.expertName}</td>
                          <td className="px-4 py-3 text-ink/75">{b.concernLabel}</td>
                          <td className="px-4 py-3">
                            <Chip label={session.label} tone={session.tone} />
                          </td>
                          <td className="px-4 py-3">
                            <Chip label={pay.label} tone={pay.tone} />
                            {b.payment?.refundAmount ? (
                              <span className="mt-1 block text-[0.75rem] text-ink/60">
                                −{formatINR(b.payment.refundAmount)}
                              </span>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-forest-900">
                            {b.proBono ? (
                              <span className="text-ink/60">Free</span>
                            ) : (
                              formatINR(b.amount)
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(() => {
                              const left = refundableAmount(b.payment);
                              return (
                                <RefundButton
                                  bookingId={b.id}
                                  bookingRef={b.ref}
                                  max={left.max}
                                  alreadyBack={left.alreadyBack}
                                  blocked={left.max > 0 ? null : left.reason}
                                />
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:pt-1">
          <BlockClient
            clientId={c.id}
            name={c.name}
            blockedAt={c.blockedAt?.toISOString() ?? null}
            blockedReason={c.blockedReason}
            blockedBy={c.blockedBy?.name ?? null}
            upcoming={c.upcoming.length}
          />

          {c.upcoming.length > 0 && (
            <div className="rounded-2xl border border-gold/40 bg-gold/[0.08] p-5">
              <p className="font-display text-lg font-medium text-forest-900">
                {c.upcoming.length} upcoming{" "}
                {c.upcoming.length === 1 ? "session" : "sessions"}
              </p>
              <ul className="mt-3 space-y-2.5 text-[0.86rem]">
                {c.upcoming.map((b) => (
                  <li key={b.id} className="flex justify-between gap-3">
                    <span className="text-forest-900">
                      {formatDateISO(b.date)} · {b.time}
                    </span>
                    <span className="shrink-0 text-ink/65">{b.expertName}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-gold/30 pt-3 text-[0.8rem] leading-relaxed text-ink/70">
                These stay in the practitioner&apos;s calendar whatever you do here. Cancel them
                from{" "}
                <Link href="/admin/bookings" className="font-medium text-forest-800 underline underline-offset-2">
                  Bookings
                </Link>{" "}
                if that is what you want.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
            <h2 className="font-display text-lg font-medium text-forest-900">Their details</h2>
            <dl className="mt-4 space-y-3.5">
              <Detail label="Where">
                {c.city || c.state ? [c.city, c.state].filter(Boolean).join(", ") : none}
              </Detail>
              <Detail label="Mobile">
                {c.phone ? (
                  <>
                    {c.phone}
                    {!c.phoneVerified && <span className="ml-2 text-[0.8rem] text-gold-dark">unconfirmed</span>}
                  </>
                ) : (
                  none
                )}
              </Detail>
              <Detail label="Age and gender">
                {currentAge(c) !== null || c.gender
                  ? [currentAge(c), c.gender].filter((v) => v !== null && v !== "").join(" · ")
                  : none}
              </Detail>
              <Detail label="Language">{c.language || none}</Detail>
              <Detail label="School, college or workplace">{c.organisation || none}</Detail>
            </dl>
            <p className="mt-5 border-t border-forest-800/10 pt-4 text-[0.8rem] leading-relaxed text-ink/60">
              What they wrote for their therapist, and anything from an intake form, is not shown
              here and is not loaded by this page. That is between them and the person they booked.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
