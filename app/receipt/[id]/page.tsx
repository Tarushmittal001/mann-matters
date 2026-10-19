import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PAYMENT_STATUS } from "@/lib/features/booking/policy";
import { serviceBySlug } from "@/lib/service-catalogue";
import {
  BUSINESS,
  GST,
  allocateReceiptNumber,
  methodLabel,
  receiptDate,
  taxBreakdown,
} from "@/lib/receipts";
import { formatDateISO, formatINR } from "@/lib/utils";
import PrintButton from "@/components/booking/PrintButton";

export const metadata: Metadata = {
  title: "Receipt",
  // a document with somebody's name, therapist and fee on it
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One session's receipt, on a page built to be printed or saved as a PDF.
 *
 * It exists because a session is reimbursable and the reimbursement needs a
 * number. Everything on it is a fact already in the record — nothing is
 * computed for effect — and the concern is deliberately left off: an employer
 * reading this is entitled to know a consultation happened, not what it was
 * about.
 */
export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { download?: string };
}) {
  const session = await getSession();
  if (!session) redirect(`/login?next=/receipt/${params.id}`);

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { payment: true, user: { select: { name: true, email: true } } },
  });

  if (!booking) notFound();
  if (booking.userId !== session.sub && session.role !== "ADMIN") notFound();

  const payment = booking.payment;
  const paid = payment?.status === PAYMENT_STATUS.paid;
  const waived = payment?.status === PAYMENT_STATUS.waived;
  // A refunded session keeps its receipt: the money was taken and then given
  // back, and both belong on the same document. The dashboard links here for
  // refunds, and it used to land on "no receipt yet".
  const wasRefunded = payment?.status === PAYMENT_STATUS.refunded;

  if (!payment || (!paid && !waived && !wasRefunded)) {
    return (
      <div className="page-top wrap pb-28">
        <h1 className="h-display text-3xl">No receipt yet</h1>
        <p className="mt-4 max-w-lg text-ink/65">
          This session hasn&apos;t been paid for, so there&apos;s nothing to receipt. Once the
          payment goes through, the receipt appears here on its own.
        </p>
        <Link href="/dashboard" className="link-draw mt-6 inline-block font-medium text-forest-800">
          Back to my sessions
        </Link>
      </div>
    );
  }

  // The free session gets an acknowledgement, not a numbered receipt: there is
  // no money to account for, and numbering it would put a hole in the book.
  const number = paid || wasRefunded ? await allocateReceiptNumber(payment.id) : null;
  const issued = payment.receiptAt ?? payment.paidAt ?? booking.createdAt;

  // What was actually sold. Older bookings pre-date the service column and
  // fall back to the generic line they were sold under.
  const service = booking.serviceSlug ? serviceBySlug(booking.serviceSlug) : null;
  const gross = booking.fullAmount ?? booking.amount;
  const discount = gross > booking.amount ? gross - booking.amount : 0;
  const tax = taxBreakdown(booking.amount);
  const refunded =
    payment.refundedAt && payment.refundAmount
      ? { amount: payment.refundAmount, on: payment.refundedAt }
      : null;

  return (
    <div className="page-top wrap pb-24">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4" data-print-hide>
        <Link href="/dashboard" className="link-draw text-sm font-medium text-forest-800">
          &larr; My sessions
        </Link>
        <PrintButton label="Print or save as PDF" auto={searchParams?.download === "1"} />
      </div>

      <article
        className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-forest-800/12 bg-ivory-light shadow-lift"
        data-receipt
      >
        {/* The masthead carries the brand, so a receipt forwarded to an
            employer or an insurer is recognisably from somebody. */}
        <header className="bg-forest-950 px-8 py-7 text-ivory sm:px-11">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Image
                src="/brand/emoraa-wordmark.png"
                alt={BUSINESS.name}
                width={1200}
                height={204}
                className="h-7 w-auto brightness-0 invert"
                priority
              />
              <div className="mt-3 space-y-0.5 text-[0.82rem] leading-relaxed text-ivory/65">
                {BUSINESS.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {BUSINESS.gstin && <p className="pt-1">GSTIN {BUSINESS.gstin}</p>}
              </div>
            </div>

            <div className="text-right">
              <p className="flex items-center justify-end gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold">
                <span className="font-deva text-sm normal-case tracking-normal" aria-hidden="true">
                  मन
                </span>
                {paid || wasRefunded ? (GST.enabled ? "Tax invoice" : "Receipt") : "Acknowledgement"}
              </p>
              {number ? (
                <p className="mt-1.5 font-mono text-[1rem] font-semibold tracking-tight text-ivory">
                  {number}
                </p>
              ) : (
                <p className="mt-1.5 text-[0.9rem] text-ivory/70">No charge</p>
              )}
              <p className="mt-1 text-[0.82rem] text-ivory/65">{receiptDate(issued)}</p>
            </div>
          </div>

          {/* the same Devanagari mark the rest of the site signs off with */}
        </header>

        {/* a gold hairline under the band, as on the rest of the site */}
        <div aria-hidden="true" className="h-[3px] bg-gold" />

        <div className="px-8 py-7 sm:px-11">
        {/* who it is for */}
        <section className="grid gap-7 border-b border-forest-800/10 pb-7 sm:grid-cols-2">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
              Billed to
            </p>
            <p className="mt-2 text-[1.02rem] font-medium text-forest-900">{booking.user.name}</p>
            <p className="text-[0.88rem] text-ink/70">{booking.user.email}</p>
          </div>
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
              Session reference
            </p>
            <p className="mt-2 font-mono text-[1.02rem] font-semibold text-forest-900">
              {booking.ref}
            </p>
          </div>
        </section>

        {/* what it covers */}
        <section className="py-7">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">What this receipt covers</caption>
            <thead>
              <tr className="border-b border-forest-800/10">
                <th
                  scope="col"
                  className="pb-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink/70"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="pb-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink/70"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-forest-800/[0.06]">
                <td className="py-4 pr-4 align-top">
                  <p className="text-[1rem] font-medium text-forest-900">
                    {service ? service.title : "Online counselling session"}
                    {service && <> &middot; {service.duration}</>}
                  </p>
                  <p className="mt-1 text-[0.85rem] leading-relaxed text-ink/70">
                    {formatDateISO(booking.date)} at {booking.time} IST
                    <br />
                    With {booking.expertName}
                  </p>
                </td>
                <td className="py-4 text-right align-top font-display text-[1.05rem] tabular-nums text-forest-900">
                  {formatINR(gross)}
                </td>
              </tr>

              {discount > 0 && (
                <tr className="border-b border-forest-800/[0.06]">
                  <td className="py-3 pr-4 text-[0.92rem] text-ink/70">
                    Discount
                    {booking.couponCode && (
                      <span className="ml-1.5 font-mono text-[0.85rem] text-forest-700">
                        {booking.couponCode}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right text-[0.95rem] tabular-nums text-forest-700">
                    &minus;{formatINR(discount)}
                  </td>
                </tr>
              )}

              {tax?.map((line) => (
                <tr key={line.label} className="border-b border-forest-800/[0.06]">
                  <td className="py-3 pr-4 text-[0.92rem] text-ink/70">
                    {line.label} @ {line.rate}%
                  </td>
                  <td className="py-3 text-right text-[0.95rem] tabular-nums text-ink/70">
                    {formatINR(line.amount)}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>

          {/* The one number anybody is looking for, given its own band so it
              survives a glance, a photocopy and a fax to an insurer. */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sage-light/45 px-5 py-4">
            <div className="flex items-center gap-3">
              <p className="font-display text-[1.05rem] font-medium text-forest-900">
                {waived ? "Charged" : "Total paid"}
              </p>
              {paid && !refunded && (
                <span className="rounded-full bg-forest-800 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ivory">
                  Paid
                </span>
              )}
              {refunded && (
                <span className="rounded-full bg-forest-800/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-forest-800">
                  Refunded
                </span>
              )}
            </div>
            <p className="font-display text-[2rem] font-medium leading-none tabular-nums text-forest-900">
              {formatINR(booking.amount)}
            </p>
          </div>

          {waived && (
            <p className="mt-4 rounded-xl bg-sage-light/40 px-4 py-3 text-[0.88rem] text-forest-800">
              This was the free first session. Nothing was charged, and nothing is owed.
            </p>
          )}

          {refunded && (
            <p className="mt-4 rounded-xl bg-forest-800/[0.06] px-4 py-3 text-[0.88rem] text-forest-800">
              {formatINR(refunded.amount)} was refunded on {receiptDate(refunded.on)}.
            </p>
          )}
        </section>

        {/* how it was paid */}
        {(paid || wasRefunded) && (
          <section className="grid gap-5 border-t border-forest-800/10 py-7 sm:grid-cols-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
                Paid on
              </p>
              <p className="mt-1.5 text-[0.92rem] text-forest-900">
                {payment.paidAt ? receiptDate(payment.paidAt) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
                Method
              </p>
              <p className="mt-1.5 text-[0.92rem] text-forest-900">{methodLabel(payment)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink/70">
                Payment reference
              </p>
              <p className="mt-1.5 break-all font-mono text-[0.82rem] text-forest-900">
                {payment.reference ?? "—"}
              </p>
            </div>
          </section>
        )}

        {/* Where to write if something on this is wrong — spelled out rather
            than buried in the small print, because the person querying a
            receipt is usually an accounts department in a hurry. */}
        <section className="rounded-2xl border border-forest-800/10 bg-ivory px-5 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/70">
            Questions about this receipt
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[0.9rem]">
            <a href={`mailto:${BUSINESS.email}`} className="font-medium text-forest-800">
              {BUSINESS.email}
            </a>
            <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className="text-ink/70">
              {BUSINESS.phone}
            </a>
          </div>
        </section>

        <footer className="mt-6 border-t border-forest-800/10 pt-5 text-[0.78rem] leading-relaxed text-ink/70">
          {!GST.enabled && <p>{GST.exemptNote}</p>}
          {BUSINESS.pan && <p className="mt-1">PAN {BUSINESS.pan}</p>}
          <p className="mt-2">
            This is a computer-generated receipt and is valid without a signature.
          </p>
        </footer>
        </div>
      </article>

      <p className="mx-auto mt-6 max-w-2xl text-[0.8rem] leading-relaxed text-ink/70" data-print-hide>
        What you talked about is not on this receipt and never will be. An employer or an insurer is
        entitled to see that a consultation happened, not what it was about.
      </p>
    </div>
  );
}
