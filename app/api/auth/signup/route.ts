import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in." },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });

  // issue a verification link and email it — no session until they confirm
  const token = await issueVerificationToken(user.id);
  const link = `${new URL(req.url).origin}/verify?token=${token}`;
  try {
    await sendVerificationEmail(user.email, user.name, link);
  } catch {
    // don't fail signup if the mailer hiccups — they can resend
  }

  return NextResponse.json({ pendingVerification: true, email: user.email });
}
