import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking || (booking.userId !== session.sub && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "This booking is already cancelled." }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ booking: updated });
}
