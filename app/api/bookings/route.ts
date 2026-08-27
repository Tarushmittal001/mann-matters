import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { concerns, experts, timeSlots } from "@/lib/experts";
import { todayISO } from "@/lib/utils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const allSlots = new Set(timeSlots.flatMap((g) => g.slots));
const MAX_BOOKING_DAYS = 14;

function isValidDate(value: string) {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().slice(0, 10) === value;
}

function slotKey(expertId: string, date: string, time: string) {
  return `${expertId}:${date}:${time}`;
}

function isBookableDate(date: string) {
  const today = todayISO();
  const lastBookable = new Date(`${today}T00:00:00Z`);
  lastBookable.setUTCDate(lastBookable.getUTCDate() + MAX_BOOKING_DAYS);
  return date > today && date <= lastBookable.toISOString().slice(0, 10);
}

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

  if (!concern || !expert || !date || !isValidDate(date) || !time || !allSlots.has(time)) {
    return NextResponse.json({ error: "That booking doesn't look complete." }, { status: 400 });
  }

  if (!isBookableDate(date)) {
    return NextResponse.json(
      { error: "Please pick a date from tomorrow onwards." },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        ref: makeRef(),
        userId: session.sub,
        concern: concern.id,
        expertId: expert.id,
        expertName: expert.name,
        slotKey: slotKey(expert.id, date, time),
        date,
        time,
        amount: expert.price,
      },
    });

    return NextResponse.json({ ref: booking.ref, id: booking.id });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "That slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const expertId = url.searchParams.get("expertId");
  const date = url.searchParams.get("date");
  if (expertId || date) {
    if (
      !expertId ||
      !experts.some((expert) => expert.id === expertId) ||
      !date ||
      !isValidDate(date) ||
      !isBookableDate(date)
    ) {
      return NextResponse.json({ error: "Invalid availability request." }, { status: 400 });
    }
    const bookings = await prisma.booking.findMany({
      where: { expertId, date, status: "CONFIRMED" },
      select: { time: true },
    });
    const taken = new Set(bookings.map((booking: { time: string }) => booking.time));
    return NextResponse.json({ available: timeSlots.flatMap((group) => group.slots).filter((time) => !taken.has(time)) });
  }

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
