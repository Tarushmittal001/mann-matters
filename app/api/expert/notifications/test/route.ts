import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendExpertTestNotification } from "@/lib/email";

/**
 * POST /api/expert/notifications/test
 *
 * Sends one real email to the signed-in practitioner. The reply says whether it
 * was actually delivered or only logged to the server console (dev, with no
 * mail key configured) — a confirmation that lies is worse than none.
 */
export async function POST() {
  const session = await getSession();
  if (!session || (session.role !== "EXPERT" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  try {
    const delivered = await sendExpertTestNotification(session.email, session.name.split(" ")[0]);
    return NextResponse.json({
      delivered,
      message: delivered
        ? "Sent to " + session.email + ". It should land within a minute."
        : "Mail delivery is not configured on this environment, so it was written to the server log instead.",
    });
  } catch {
    return NextResponse.json(
      { error: "Our mail provider refused that. Nothing is wrong with your settings — try again shortly." },
      { status: 502 }
    );
  }
}
