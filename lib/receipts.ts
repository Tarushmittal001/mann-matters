import { prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { PAYMENT_STATUS } from "@/lib/features/booking/policy";

/**
 * Receipts.
 *
 * A therapy session is one of the few things people are reimbursed for by an
 * employer or an insurer, and the difference between getting that money back
 * and not is usually a piece of paper with a number on it. So every paid
 * session here can produce one, and it is a real book of receipts: numbered in
 * sequence, allocated once, never reused.
 *
 * GST is off. Healthcare services are exempt when they are provided by a
 * clinical establishment, so there is no tax line and no GSTIN to print — but
 * the shape below is the shape of a tax invoice, so switching it on later is
 * filling in `BUSINESS.gstin` and flipping `GST.enabled`, not rewriting this.
 * Before flipping it, check the rate and the place-of-supply rule with an
 * accountant: an invoice that charges tax wrongly is worse than one that
 * charges none.
 */

// ── who is issuing it ────────────────────────────────────────────────────────

export const BUSINESS = {
  name: site.name,
  legalName: "Emoraa",
  addressLines: ["Noida, Uttar Pradesh", "India"],
  email: site.email,
  phone: site.phone,
  /** Fill this in the day you register, and set GST.enabled below. */
  gstin: null as string | null,
  /** Printed under the total when there is no tax line. */
  pan: null as string | null,
} as const;

export const GST = {
  enabled: false,
  /** Per cent. Unused while `enabled` is false. */
  rate: 18,
  /** The state the business supplies from — decides CGST+SGST against IGST. */
  homeState: "Uttar Pradesh",
  /**
   * Shown in place of a tax breakdown. Worded as a statement of what this
   * invoice does, not as tax advice to the reader.
   */
  exemptNote:
    "GST is not charged on this receipt. Healthcare services provided by a clinical establishment are exempt from GST in India.",
} as const;

// ── numbering ────────────────────────────────────────────────────────────────

/**
 * The Indian financial year a date falls in: April to March.
 * 14 Feb 2027 → "2026-27", because the year turned over the previous April.
 */
export function financialYear(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

const SERIES = "EMR";

function receiptNumber(fy: string, seq: number): string {
  return `${SERIES}/${fy}/${String(seq).padStart(4, "0")}`;
}

/**
 * Give this payment its number, or hand back the one it already has.
 *
 * The sequence is per financial year and continues from the highest number
 * already issued rather than from a count, so a deleted row leaves a gap in
 * the numbers rather than handing the next receipt a number somebody is
 * already holding. The UNIQUE index settles a race: the loser simply asks again and
 * takes the next number.
 */
export async function allocateReceiptNumber(
  paymentId: string,
  now: Date = new Date()
): Promise<string | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, receiptNo: true },
  });
  if (!payment) return null;
  if (payment.receiptNo) return payment.receiptNo;
  // Nothing was taken, so there is nothing to receipt. A refund is not that
  // case: money moved, and the refund is recorded on the same receipt.
  if (payment.status !== PAYMENT_STATUS.paid && payment.status !== PAYMENT_STATUS.refunded) {
    return null;
  }

  const fy = financialYear(now);
  const prefix = `${SERIES}/${fy}/`;

  for (let attempt = 0; attempt < 6; attempt++) {
    // Taken from the counter, which only ever goes up. Deriving it from the
    // payments table — by count or by highest — handed a deleted receipt's
    // number to the next person.
    const seq = await prisma.$transaction(async (tx) => {
      const row = await tx.receiptSequence.upsert({
        where: { fy },
        create: { fy, next: 2 },
        update: { next: { increment: 1 } },
        select: { next: true },
      });
      // `next` is the value *after* the increment on an existing row, and the
      // row we just created starts life pointing at 2 — either way the number
      // to use is one below it.
      return row.next - 1;
    });

    const candidate = receiptNumber(fy, seq);
    try {
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { receiptNo: candidate, receiptAt: now },
        select: { receiptNo: true },
      });
      return updated.receiptNo;
    } catch (error) {
      // somebody already holds that number; take the next one
      if ((error as { code?: string })?.code === "P2002") continue;
      throw error;
    }
  }
  return null;
}

// ── the document ─────────────────────────────────────────────────────────────

export type ReceiptLine = {
  label: string;
  detail: string;
  amount: number;
};

export type Receipt = {
  number: string;
  issuedAt: Date;
  /** Who it is made out to. */
  billedTo: { name: string; email: string };
  bookingRef: string;
  sessionDate: string;
  sessionTime: string;
  expertName: string;
  serviceLabel: string;
  lines: ReceiptLine[];
  /** Before any discount. */
  gross: number;
  discount: { code: string | null; amount: number } | null;
  /** What was actually charged. */
  total: number;
  tax: { label: string; rate: number; amount: number }[] | null;
  paidOn: Date | null;
  method: string;
  reference: string | null;
  refunded: { amount: number; on: Date } | null;
};

/** "UPI pr••••@okhdfcbank" / "Visa •••• 4242" — never the instrument itself. */
export function methodLabel(payment: {
  method: string | null;
  cardBrand: string | null;
  last4: string | null;
  vpaMasked: string | null;
  status: string;
}): string {
  if (payment.status === PAYMENT_STATUS.waived) return "No charge";
  if (payment.method === "card") {
    return `${payment.cardBrand ?? "Card"} •••• ${payment.last4 ?? "••••"}`;
  }
  if (payment.method === "upi") return `UPI ${payment.vpaMasked ?? ""}`.trim();
  return "—";
}

/**
 * Tax on a total that already includes it, split the way the place of supply
 * demands: within the home state it is CGST + SGST at half each, outside it is
 * one IGST line. Returns null while GST is off.
 */
export function taxBreakdown(total: number, buyerState?: string | null) {
  if (!GST.enabled) return null;
  const base = Math.round((total * 100) / (100 + GST.rate));
  const tax = total - base;
  const interState = !!buyerState && buyerState !== GST.homeState;
  return interState
    ? [{ label: "IGST", rate: GST.rate, amount: tax }]
    : [
        { label: "CGST", rate: GST.rate / 2, amount: Math.round(tax / 2) },
        { label: "SGST", rate: GST.rate / 2, amount: tax - Math.round(tax / 2) },
      ];
}

/** "14 Feb 2027" — the format every Indian accounts department expects. */
export function receiptDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
