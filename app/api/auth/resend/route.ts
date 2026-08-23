import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

// generic reply — never reveal whether an email is registered
const GENERIC = NextResponse.json({
  ok: true,
  message: "If that account needs confirming, a fresh link is on its way.",
});

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email) return GENERIC;

  const user = await prisma.user.findUnique({ where: { email } });
  // only act for real, still-unverified accounts; reply is identical either way
  if (user && !user.emailVerified) {
    // light cooldown: skip if a token was issued in the last 60 seconds
    const recent = await prisma.verificationToken.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
    });
    if (!recent) {
      const token = await issueVerificationToken(user.id);
      const link = `${new URL(req.url).origin}/verify?token=${token}`;
      try {
        await sendVerificationEmail(user.email, user.name, link);
      } catch {
        /* swallow — generic response regardless */
      }
    }
  }

  return GENERIC;
}
