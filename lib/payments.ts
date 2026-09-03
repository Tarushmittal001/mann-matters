import { randomBytes } from "node:crypto";
import {
  cardBrand,
  digitsOnly,
  last4,
  maskVpa,
  type CardInput,
  type PayMethod,
} from "@/lib/payment-fields";

/**
 * A stand-in for a real payment gateway (Razorpay/Stripe would sit here).
 *
 * It is deliberately *deterministic*: given the same instrument it always gives
 * the same outcome, so every failure path in the UI can be demonstrated and
 * tested on purpose rather than waited for. Swapping this module for a real
 * gateway means keeping `charge()`'s signature and return shape — nothing
 * upstream reads anything else.
 *
 * SECURITY: the card number and CVV enter this function and leave in the bin.
 * `ChargeResult` carries only a brand and last four. Nothing here is logged.
 */

export type ChargeFailure = {
  code:
    | "CARD_DECLINED"
    | "INSUFFICIENT_FUNDS"
    | "GATEWAY_TIMEOUT"
    | "RISK_HOLD"
    | "UPI_DECLINED"
    | "UPI_TIMEOUT";
  /** Shown to the user verbatim. Says what happened and what to do next. */
  message: string;
  /** Retrying the same instrument is pointless for some of these. */
  retryable: boolean;
};

export type ChargeResult =
  | {
      ok: true;
      reference: string;
      method: PayMethod;
      cardBrand?: string;
      last4?: string;
      vpaMasked?: string;
    }
  | {
      ok: false;
      failure: ChargeFailure;
      method: PayMethod;
      cardBrand?: string;
      last4?: string;
      vpaMasked?: string;
    };

const FAILURES: Record<ChargeFailure["code"], Omit<ChargeFailure, "code">> = {
  CARD_DECLINED: {
    message:
      "Your bank declined this card. Nothing has been charged — try another card or pay by UPI.",
    retryable: false,
  },
  INSUFFICIENT_FUNDS: {
    message:
      "Your bank reported insufficient funds. Nothing has been charged — try another method.",
    retryable: false,
  },
  GATEWAY_TIMEOUT: {
    message:
      "The payment network didn't respond in time. Nothing has been charged — your slot is still held, please try again.",
    retryable: true,
  },
  RISK_HOLD: {
    message:
      "Your bank has flagged this payment for a security check. Approve it in your banking app, then try again.",
    retryable: true,
  },
  UPI_DECLINED: {
    message:
      "The UPI request was declined. Nothing has been charged — check the UPI ID or try a card.",
    retryable: false,
  },
  UPI_TIMEOUT: {
    message:
      "The UPI request expired before it was approved. Nothing has been charged — your slot is still held, please try again.",
    retryable: true,
  },
};

function fail(code: ChargeFailure["code"]): ChargeFailure {
  return { code, ...FAILURES[code] };
}

function reference(): string {
  return `pay_${randomBytes(9).toString("base64url")}`;
}

/**
 * Deterministic outcomes, so every state in the UI is reachable on demand.
 *
 * The trigger is the card's last four digits — but a card is Luhn-checked
 * before it ever reaches here, so use these numbers rather than inventing your
 * own with the right tail (most such inventions fail the checksum and you'll
 * see a validation error instead of the failure you were aiming for):
 *
 *   4000 0000 0000 0002  → declined by bank
 *   4000 0000 0009 0003  → insufficient funds
 *   4000 0000 0008 0004  → gateway timeout    (retryable)
 *   4000 0000 0007 0005  → risk hold          (retryable)
 *   4242 4242 4242 4242  → succeeds
 *
 *   UPI id starting "fail" → declined; starting "slow" → timeout (retryable).
 *
 * Anything else succeeds.
 */
export async function charge(input: {
  method: PayMethod;
  amount: number;
  card?: CardInput;
  vpa?: string;
}): Promise<ChargeResult> {
  // a real gateway round-trip is not instant; the UI must survive the wait
  await new Promise((r) => setTimeout(r, 700));

  if (input.method === "card") {
    const pan = digitsOnly(input.card?.number ?? "");
    const tail = last4(pan);
    const brand = cardBrand(pan);
    const shared = { method: "card" as const, cardBrand: brand, last4: tail };

    const trigger: Partial<Record<string, ChargeFailure["code"]>> = {
      "0002": "CARD_DECLINED",
      "0003": "INSUFFICIENT_FUNDS",
      "0004": "GATEWAY_TIMEOUT",
      "0005": "RISK_HOLD",
    };
    const code = trigger[tail];
    if (code) return { ok: false, failure: fail(code), ...shared };

    return { ok: true, reference: reference(), ...shared };
  }

  const vpa = (input.vpa ?? "").trim();
  const local = vpa.split("@")[0]?.toLowerCase() ?? "";
  const shared = { method: "upi" as const, vpaMasked: maskVpa(vpa) };

  if (local.startsWith("fail")) {
    return { ok: false, failure: fail("UPI_DECLINED"), ...shared };
  }
  if (local.startsWith("slow")) {
    return { ok: false, failure: fail("UPI_TIMEOUT"), ...shared };
  }

  return { ok: true, reference: reference(), ...shared };
}

/**
 * Refunds are asynchronous at every real gateway; we record the intent
 * immediately and tell the user the bank timeline rather than pretending the
 * money has already moved.
 */
export async function refund(amount: number): Promise<{ ok: true; reference: string }> {
  await new Promise((r) => setTimeout(r, 200));
  return { ok: true, reference: `rfnd_${randomBytes(9).toString("base64url")}` };
}
