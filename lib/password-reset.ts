import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/verification";

/**
 * "Forgot password" links. The database only ever holds a sha-256 of the token,
 * so a leaked backup can't be used to take an account; the raw token lives only
 * in the emailed link.
 */

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * An expert's first link is not a password reset, and an hour is the wrong
 * window for it. Nobody asked for this email and nobody is waiting by the
 * inbox: it lands unannounced, often while they are with a client, and it is
 * the only way into the account. Two days is long enough to be read after a
 * working day, short enough that a forwarded mail is not a standing key.
 */
const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

/** A fresh link for this user; any earlier one stops working. */
export async function issueResetToken(userId: string, ttlMs = RESET_TTL_MS): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + ttlMs) },
  });
  return raw;
}

/**
 * The same one-time token, on the invite window.
 *
 * It shares the reset table deliberately: /api/auth/reset already spends a
 * token exactly once, stamps the email as confirmed because reading it proved
 * the address, and signs the person in. An invite needs all three. A second
 * near-identical table would be a second place for that logic to drift.
 */
export async function issueInviteToken(userId: string): Promise<string> {
  return issueResetToken(userId, INVITE_TTL_MS);
}

/** For the copy in the email and in the admin's confirmation. */
export const INVITE_TTL_HOURS = INVITE_TTL_MS / 3_600_000;

/** The user this token belongs to, or null when it's unknown or expired. */
export async function resetTokenOwner(raw: string) {
  if (!raw) return null;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }
  return record.user;
}

/** One-time use: called once the new password is stored. */
export async function clearResetTokens(userId: string) {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
}
