import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { concerns } from "@/lib/experts";
import { formatDateISO, formatINR, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Bookings | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] });
  const today = todayISO();
  const upcoming = bookings.filter((booking) => booking.status === "CONFIRMED" && booking.date > today);

  return (
    <main className="wrap-wide pb-28">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">booking operations</p>
          <h1 className="h-display mt-3 text-4xl md:text-5xl">All bookings</h1>
          <p className="mt-4 max-w-xl text-ink/65">Review every appointment, its owner, and its current status from one place.</p>
        </div>
        <div className="rounded-2xl border border-forest-800/10 bg-ivory-light px-5 py-4 shadow-lift">
          <p className="font-display text-2xl font-medium text-forest-900">{upcoming.length}</p>
          <p className="text-sm text-ink/60">upcoming sessions</p>
        </div>
      </div>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift">
        {bookings.length === 0 ? (
          <p className="p-12 text-center text-ink/60">No bookings yet.</p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-forest-800 text-[0.7rem] uppercase tracking-[0.14em] text-ivory">
              <tr><th className="px-5 py-4">Reference</th><th className="px-4 py-4">Client</th><th className="px-4 py-4">Expert</th><th className="px-4 py-4">Concern</th><th className="px-4 py-4">Session</th><th className="px-4 py-4">Fee</th><th className="px-5 py-4">Status</th></tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-forest-800/[0.08]">
                  <td className="px-5 py-4 font-mono font-semibold text-forest-800">{booking.ref}</td>
                  <td className="px-4 py-4 text-ink/70">{booking.userId.slice(0, 10)}...</td>
                  <td className="px-4 py-4 font-medium text-forest-900">{booking.expertName}</td>
                  <td className="px-4 py-4 text-ink/70">{concerns.find((item) => item.id === booking.concern)?.label ?? booking.concern}</td>
                  <td className="px-4 py-4 text-ink/70">{formatDateISO(booking.date)} · {booking.time}</td>
                  <td className="px-4 py-4 text-ink/70">{formatINR(booking.amount)}</td>
                  <td className="px-5 py-4"><span className={booking.status === "CANCELLED" ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700" : "rounded-full bg-sage-light/70 px-2.5 py-1 text-xs font-semibold text-forest-800"}>{booking.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
