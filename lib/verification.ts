import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/** sha-256, so the database never stores a usable token. */
export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Issue a fresh verification token for a user. Any previous tokens are dropped
 * so only the newest link works. Returns the RAW token (for the email link).
 */
export async function issueVerificationToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await prisma.verificationToken.deleteMany({ where: { userId } });
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return raw;
}

/**
 * Consume a raw token: verifies the user, deletes the token (one-time use), and
 * returns the user. Returns null if the token is unknown or expired.
 */
export async function consumeVerificationToken(raw: string) {
  if (!raw) return null;
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!record) return null;

  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }

  const user = await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.deleteMany({ where: { userId: record.userId } });
  return user;
}
