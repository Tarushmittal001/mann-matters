import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

const OTP_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

function otpKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function hashOtp(code: string) {
  return createHmac("sha256", otpKey()).update(code).digest("hex");
}

export async function issuePhoneOtp(userId: string, phone: string) {
  const code = String(randomInt(100_000, 1_000_000));
  await prisma.$transaction([
    prisma.phoneOtp.deleteMany({ where: { userId } }),
    prisma.phoneOtp.create({
      data: {
        userId,
        phone,
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    }),
  ]);
  return code;
}

export async function consumePhoneOtp(userId: string, phone: string, code: string) {
  const record = await prisma.phoneOtp.findFirst({
    where: { userId, phone },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return false;

  if (record.expiresAt <= new Date() || record.attempts >= MAX_ATTEMPTS) {
    await prisma.phoneOtp.deleteMany({ where: { userId } });
    return false;
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const actual = Buffer.from(hashOtp(code), "hex");
  const valid = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!valid) {
    const attempts = record.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await prisma.phoneOtp.deleteMany({ where: { userId } });
    } else {
      await prisma.phoneOtp.update({ where: { id: record.id }, data: { attempts } });
    }
    return false;
  }

  await prisma.phoneOtp.deleteMany({ where: { userId } });
  return true;
}