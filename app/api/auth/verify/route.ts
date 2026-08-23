import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { consumeVerificationToken } from "@/lib/verification";

export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const user = await consumeVerificationToken((body.token ?? "").trim());
  if (!user) {
    return NextResponse.json(
      { error: "This link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // verified — log them straight in
  await createSession(user);
  return NextResponse.json({
    user: { name: user.name, email: user.email, role: user.role },
  });
}
