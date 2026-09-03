/**
 * Payment field rules and masking — pure, shared by the payment form and the
 * route handler.
 *
 * Nothing here stores anything. The card number and CVV exist only long enough
 * to be validated; the only values ever allowed to leave this module for
 * persistence are the brand and the last four digits.
 */

export type PayMethod = "upi" | "card";

export const PAY_METHODS: { id: PayMethod; label: string; hint: string }[] = [
  { id: "upi", label: "UPI", hint: "GPay, PhonePe, Paytm, any UPI app" },
  { id: "card", label: "Card", hint: "Debit or credit" },
];

export const UPI_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9.]{1,32}$/;

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Luhn checksum — catches typos before we ever call a gateway. */
export function luhnValid(pan: string): boolean {
  const digits = digitsOnly(pan);
  if (digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(pan: string): string {
  const d = digitsOnly(pan);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^(60|65|81|82|508)/.test(d)) return "RuPay";
  if (/^3[47]/.test(d)) return "Amex";
  return "Card";
}

export function last4(pan: string): string {
  return digitsOnly(pan).slice(-4);
}

/** `priya.sharma@okhdfcbank` → `pr••••••@okhdfcbank` */
export function maskVpa(vpa: string): string {
  const [local, handle] = vpa.split("@");
  if (!handle) return "••••";
  const head = local.slice(0, 2);
  return `${head}${"•".repeat(Math.max(3, Math.min(local.length - 2, 8)))}@${handle}`;
}

export function formatCardDisplay(brand?: string | null, tail?: string | null): string {
  if (!brand && !tail) return "";
  return `${brand ?? "Card"} •••• ${tail ?? "••••"}`;
}

export type CardInput = { number: string; expiry: string; cvv: string; name: string };

/** Expiry as `MM/YY`; must be this month or later. */
export function expiryError(expiry: string, now: Date = new Date()): string | null {
  const m = /^(\d{2})\s*\/?\s*(\d{2})$/.exec(expiry.trim());
  if (!m) return "Use MM/YY.";
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "That month isn't valid.";
  // last instant of the expiry month
  const expires = new Date(Date.UTC(year, month, 1) - 1);
  if (expires.getTime() < now.getTime()) return "That card has expired.";
  return null;
}

export function validateCard(card: CardInput, now: Date = new Date()) {
  const fields: Record<string, string> = {};
  const pan = digitsOnly(card.number);

  if (!pan) fields.number = "Enter your card number.";
  else if (pan.length < 13 || pan.length > 19) fields.number = "That card number looks short.";
  else if (!luhnValid(pan)) fields.number = "Please check the card number.";

  const exp = expiryError(card.expiry, now);
  if (exp) fields.expiry = exp;

  const cvv = digitsOnly(card.cvv);
  if (!cvv) fields.cvv = "Enter the CVV.";
  else if (cvv.length < 3 || cvv.length > 4) fields.cvv = "CVV is 3 or 4 digits.";

  if (!card.name.trim()) fields.cardName = "Enter the name on the card.";

  return fields;
}

export function validateUpi(vpa: string) {
  const fields: Record<string, string> = {};
  const v = vpa.trim();
  if (!v) fields.vpa = "Enter your UPI ID.";
  else if (!UPI_RE.test(v)) fields.vpa = "That doesn't look like a UPI ID (name@bank).";
  return fields;
}
