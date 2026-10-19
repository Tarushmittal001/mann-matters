import { prisma } from "@/lib/db";
import { financialYear } from "@/lib/receipts";

/**
 * Prescriptions, as written by a psychiatrist on this platform.
 *
 * ── WHO MAY ────────────────────────────────────────────────────────────────
 * Only a practitioner whose profession passes `canPrescribe()`. In India a
 * clinical psychologist cannot prescribe, and software that let one do it
 * would be helping somebody break the law and putting a patient on medicine
 * nobody qualified authorised. The check is on the route, not the screen.
 *
 * ── NOTHING IS EVER EDITED ─────────────────────────────────────────────────
 * A prescription records what one named, registered person authorised on one
 * day. Correcting a mistake means cancelling it and issuing a replacement, so
 * what was authorised and what withdrew it both survive.
 */

export const RX_SERIES = "EMR/RX";
export const MAX_ITEMS = 10;

export type RxItem = {
  drug: string;
  strength: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export const EMPTY_ITEM: RxItem = {
  drug: "",
  strength: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: "",
};

/**
 * Drug names that commonly sit outside what may be prescribed by
 * teleconsultation in India — Schedule X and the NDPS psychotropics, plus the
 * habit-forming hypnotics that most often come up in psychiatry.
 *
 * ── THIS LIST WARNS, IT DOES NOT DECIDE ────────────────────────────────────
 * It is indicative and will go stale. The prescriber is the registered
 * professional and is accountable for the decision — including the case where
 * an in-person examination has already happened and the restriction does not
 * bite. So a match raises a flag and nothing more.
 *
 * And because the list is incomplete, the UI must never read silence as
 * approval: a drug that is NOT flagged has not been cleared by anything. The
 * form says so.
 */
const RESTRICTED = [
  "alprazolam", "amphetamine", "amobarbital", "barbital", "buprenorphine",
  "chlordiazepoxide", "clobazam", "clonazepam", "codeine", "dextroamphetamine",
  "diazepam", "estazolam", "ethchlorvynol", "glutethimide", "ketamine",
  "lisdexamfetamine", "lorazepam", "methaqualone", "methylphenidate",
  "midazolam", "morphine", "nitrazepam", "oxazepam", "pentazocine",
  "pentobarbital", "phenobarbital", "phenobarbitone", "secobarbital",
  "temazepam", "tramadol", "triazolam", "zaleplon", "zolpidem", "zopiclone",
];

/** Whether a typed drug name looks like something telemedicine restricts. */
export function looksRestricted(drug: string): boolean {
  const name = drug.trim().toLowerCase();
  if (name.length < 3) return false;
  return RESTRICTED.some((r) => name.includes(r));
}

export type RxCheck = { ok: true; items: RxItem[] } | { ok: false; error: string };

/** What a prescription must have before it can be issued. */
export function checkItems(raw: unknown): RxCheck {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "Add at least one medicine." };
  }
  if (raw.length > MAX_ITEMS) {
    return { ok: false, error: `Up to ${MAX_ITEMS} medicines on one prescription.` };
  }

  const items: RxItem[] = [];
  for (const entry of raw) {
    const take = (k: keyof RxItem) =>
      typeof entry?.[k] === "string" ? (entry[k] as string).trim().slice(0, 200) : "";
    const item: RxItem = {
      drug: take("drug"),
      strength: take("strength"),
      dose: take("dose"),
      frequency: take("frequency"),
      duration: take("duration"),
      instructions: take("instructions"),
    };
    /* Drug, dose, frequency and duration are what make a line dispensable.
       A pharmacist handed "Sertraline" and nothing else cannot fill it, and a
       patient reading it cannot take it safely. */
    if (!item.drug) return { ok: false, error: "Every line needs the medicine's name." };
    if (!item.dose) return { ok: false, error: `How much of ${item.drug}?` };
    if (!item.frequency) return { ok: false, error: `How often should ${item.drug} be taken?` };
    if (!item.duration) return { ok: false, error: `For how long should ${item.drug} be taken?` };
    items.push(item);
  }
  return { ok: true, items };
}

export function parseItems(json: string): RxItem[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((i) => ({ ...EMPTY_ITEM, ...i }));
  } catch {
    return [];
  }
}

function rxNumber(fy: string, seq: number): string {
  return `${RX_SERIES}/${fy}/${String(seq).padStart(4, "0")}`;
}

/**
 * The next prescription number, gapless within a financial year.
 *
 * Shares the receipt counter table but under its own key, so the two series
 * never hand out the same number and neither can be derived by counting rows
 * — a deleted row would otherwise give its number to the next person.
 */
export async function nextRxNumber(now: Date = new Date()): Promise<string> {
  const fy = financialYear(now);
  const key = `RX-${fy}`;
  const seq = await prisma.$transaction(async (tx) => {
    const row = await tx.receiptSequence.upsert({
      where: { fy: key },
      create: { fy: key, next: 2 },
      update: { next: { increment: 1 } },
      select: { next: true },
    });
    return row.next - 1;
  });
  return rxNumber(fy, seq);
}
