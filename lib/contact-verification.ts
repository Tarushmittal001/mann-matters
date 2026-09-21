import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendContactCode } from "@/lib/email";
import { errors, fail, logFailure } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { hasSmsProvider, sendVerificationSms } from "@/lib/sms";

/**
 * Proof that whoever writes to us from the site owns the email address or
 * phone number they typed.
 *
 * Without it, anyone could send a message or a program enquiry as someone
 * else, and our reply would reach a stranger. So an unproven email or number
 * gets a 6-digit code, and the form only goes through once it comes back.
 *
 * Stateless on purpose: codes are never stored. The browser holds a signed
 * token binding the channel, the address, the code and an expiry; checking a
 * guess means re-signing it. Guesses are capped per token and per network by
 * the rate limiter, so a 1-in-900,000 code is never brute-forced in its 10
 * minutes.
 *
 * Once proven, a signed httpOnly cookie remembers that address for 30 days, and
 * a signed-in user is trusted for the email or number already verified on their
 * account.
 */

export type Channel = "email" | "phone";

const CODE_TTL_MS = 10 * 60_000;
const VERIFIED_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const cookieName = (channel: Channel) => `emoraa_verified_${channel}`;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("hex");

function sameHex(a: string, b: string) {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** Rate-limit keys never hold the raw address. */
const hashed = (value: string) => createHash("sha256").update(value).digest("hex");

function issueCode(channel: Channel, value: string) {
  const code = String(randomInt(100_000, 1_000_000));
  const expires = Date.now() + CODE_TTL_MS;
  const token = `${expires}.${sign(`code:${channel}:${value}:${code}:${expires}`)}`;
  return { code, token };
}

function codeExpired(token: string): boolean {
  const expires = Number(token.split(".")[0]);
  return !Number.isFinite(expires) || expires < Date.now();
}

function checkCode(channel: Channel, value: string, code: string, token: string): boolean {
  const [expiresRaw, sig] = token.split(".");
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || !sig || expires < Date.now()) return false;
  if (!/^\d{6}$/.test(code)) return false;
  return sameHex(sig, sign(`code:${channel}:${value}:${code}:${expires}`));
}

function rememberVerified(channel: Channel, value: string) {
  const expires = Date.now() + VERIFIED_MAX_AGE * 1000;
  cookies().set(cookieName(channel), `${expires}.${sign(`verified:${channel}:${value}:${expires}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VERIFIED_MAX_AGE,
    path: "/",
  });
}

/** Has this browser, or the signed-in account, already proven `value`? */
async function isVerifiedHere(channel: Channel, value: string): Promise<boolean> {
  const raw = cookies().get(cookieName(channel))?.value;
  if (raw) {
    const [expiresRaw, sig] = raw.split(".");
    const expires = Number(expiresRaw);
    if (Number.isFinite(expires) && expires > Date.now() && sig) {
      if (sameHex(sig, sign(`verified:${channel}:${value}:${expires}`))) return true;
    }
  }

  const session = await getSession();
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { email: true, emailVerified: true, phone: true, phoneVerified: true },
  });
  if (!user) return false;
  return channel === "email"
    ? user.email.toLowerCase() === value && !!user.emailVerified
    : user.phone === value && !!user.phoneVerified;
}

export type Proof =
  /** Proven: before this request, or by the code it carried. */
  | { state: "verified" }
  /** A code is on its way; the client sends it back with this token. */
  | { state: "sent"; token: string; devCode?: string }
  /** The code didn't match; show `message` on the code field. */
  | { state: "wrong"; message: string }
  /** Stop here and return this response (rate limited, expired, SMS down). */
  | { state: "blocked"; response: Response };

/**
 * One step of proving an email or phone number: already proven, check the code
 * that came with the request, or send a new code.
 *
 * `value` must already be validated and normalised (lowercase email,
 * +91XXXXXXXXXX phone).
 */
export async function prove(opts: {
  channel: Channel;
  value: string;
  name: string;
  ip: string;
  token?: string;
  code?: string;
}): Promise<Proof> {
  const { channel, value, name, ip } = opts;
  const token = opts.token?.trim() ?? "";
  const code = (opts.code ?? "").replace(/\s+/g, "");

  if (await isVerifiedHere(channel, value)) return { state: "verified" };

  if (token) {
    const perToken = rateLimit("contactVerify", `${channel}:${token}`);
    const perIp = rateLimit("contactVerifyIp", ip);
    if (!perToken.ok || !perIp.ok) {
      return {
        state: "blocked",
        response: fail(429, "Too many tries. Please ask for a new code.", { code: "CODE_LOCKED" }),
      };
    }
    if (codeExpired(token)) {
      return {
        state: "blocked",
        response: fail(410, "That code has expired. We can send you a new one.", { code: "CODE_EXPIRED" }),
      };
    }
    if (!checkCode(channel, value, code, token)) {
      return {
        state: "wrong",
        message:
          channel === "email"
            ? "That code doesn't match. Please check the email and try again."
            : "That code doesn't match. Please check the SMS and try again.",
      };
    }
    rememberVerified(channel, value);
    return { state: "verified" };
  }

  // a code goes to an address nobody has proven yet: limited per address and per network
  const perValue = rateLimit(channel === "email" ? "contactCodeEmail" : "phoneCode", hashed(value));
  const perIp = rateLimit(channel === "email" ? "contactCodeIp" : "phoneCodeIp", ip);
  if (!perValue.ok) return { state: "blocked", response: errors.rateLimited(perValue.retryAfter) };
  if (!perIp.ok) return { state: "blocked", response: errors.rateLimited(perIp.retryAfter) };

  const issued = issueCode(channel, value);

  if (channel === "email") {
    const sent = await sendContactCode(value, name, issued.code);
    return { state: "sent", token: issued.token, devCode: sent.devCode };
  }

  if (!hasSmsProvider()) {
    if (process.env.NODE_ENV === "production") {
      return {
        state: "blocked",
        response: fail(503, "We can't send SMS codes just now. Please WhatsApp or call us instead.", {
          code: "SMS_UNAVAILABLE",
        }),
      };
    }
    console.log(["", "  📱  No SMS provider configured — phone code not sent.", `      Code: ${issued.code}`, ""].join("\n"));
    return { state: "sent", token: issued.token, devCode: issued.code };
  }

  const delivery = await sendVerificationSms(value, issued.code);
  if (!delivery.sent) {
    logFailure("verification.sms", new Error(delivery.reason));
    return {
      state: "blocked",
      response: fail(503, "We couldn't send the SMS just now. Please try again in a moment.", {
        code: "SMS_FAILED",
      }),
    };
  }
  return { state: "sent", token: issued.token };
}
