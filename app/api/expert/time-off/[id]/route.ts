import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expertIdFromSession } from "@/lib/expert-data";

/** DELETE /api/expert/time-off/:id — reopen those dates to bookings. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const expert = await expertIdFromSession();
  if (!expert) {
    return NextResponse.json({ error: "You need to be signed in as a practitioner." }, { status: 401 });
  }

  const block = await prisma.timeOff.findFirst({
    where: { id: params.id, expertId: expert.expertId },
  });
  if (!block) {
    return NextResponse.json({ error: "That block is no longer there." }, { status: 404 });
  }

  await prisma.timeOff.delete({ where: { id: block.id } });

  return NextResponse.json({
    id: block.id,
    message: "Time off removed. Those dates are open for booking again.",
  });
}
