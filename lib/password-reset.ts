import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/verification";

/**
 * "Forgot password" links. The database only ever holds a sha-256 of the token,
 * so a leaked backup can't be used to take an account; the raw token lives only
 * in the emailed link.
 */

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** A fresh link for this user; any earlier one stops working. */
export async function issueResetToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  return raw;
}

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
