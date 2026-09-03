import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDateISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({ where: { role: "USER" }, include: { bookings: true }, orderBy: { createdAt: "desc" } });
  return (
    <main className="wrap-wide pb-28">
      <p className="eyebrow">client directory</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Clients</h1>
      <p className="mt-4 max-w-xl text-ink/65">Account and booking information for the people using Mann Matters.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.length === 0 ? <p className="text-ink/60">No clients have signed up yet.</p> : clients.map((client) => (
          <article key={client.id} className="rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift">
            <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-medium text-forest-900">{client.name}</h2><p className="mt-1 break-all text-sm text-ink/60">{client.email}</p></div><span className="rounded-full bg-sage-light/70 px-2.5 py-1 text-xs font-semibold text-forest-800">{client.emailVerified ? "Verified" : "Pending"}</span></div>
            <dl className="mt-6 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-ink/55">Joined</dt><dd className="text-right text-ink/75">{formatDateISO(client.createdAt.toISOString().slice(0, 10))}</dd></div><div className="flex justify-between gap-4"><dt className="text-ink/55">Bookings</dt><dd className="font-semibold text-forest-800">{client.bookings.length}</dd></div></dl>
          </article>
        ))}
      </div>
    </main>
  );
}
