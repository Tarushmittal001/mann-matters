import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns, experts, timeSlots } from "@/lib/experts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const allSlots = new Set(timeSlots.flatMap((g) => g.slots));

function makeRef() {
  return `MM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in to book a session." }, { status: 401 });
  }

  let body: { concern?: string; expertId?: string; date?: string; time?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const concern = concerns.find((c) => c.id === body.concern);
  const expert = experts.find((e) => e.id === body.expertId);
  const { date, time } = body;

  if (!concern || !expert || !date || !DATE_RE.test(date) || !time || !allSlots.has(time)) {
    return NextResponse.json({ error: "That booking doesn't look complete." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date <= today) {
    return NextResponse.json(
      { error: "Please pick a date from tomorrow onwards." },
      { status: 400 }
    );
  }

  // the same slot with the same expert can only be booked once
  const clash = await prisma.booking.findFirst({
    where: { expertId: expert.id, date, time, status: "CONFIRMED" },
  });
  if (clash) {
    return NextResponse.json(
      { error: "That slot was just taken. Please pick another time." },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      ref: makeRef(),
      userId: session.sub,
      concern: concern.id,
      expertId: expert.id,
      expertName: expert.name,
      date,
      time,
      amount: expert.price,
    },
  });

  return NextResponse.json({ ref: booking.ref, id: booking.id });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.sub },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json({ bookings });
}
