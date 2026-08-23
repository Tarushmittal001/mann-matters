import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      {
        error: "Please confirm your email first. Check your inbox for the link — we can resend it.",
        needsVerification: true,
        email: user.email,
      },
      { status: 403 }
    );
  }

  await createSession(user);
  return NextResponse.json({ user: { name: user.name, email: user.email, role: user.role } });
}
