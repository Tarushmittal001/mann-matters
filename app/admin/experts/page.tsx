import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { listAllExperts } from "@/lib/experts-store";
import ExpertManager, { type ExpertRow } from "@/components/admin/ExpertManager";

export const metadata: Metadata = { title: "Experts | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const parseList = (raw: string): string[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

export default async function AdminExpertsPage() {
  const experts = await listAllExperts();

  // how many sessions each listing carries, so the page can say what deleting
  // would throw away before anyone tries it
  const counts = await prisma.booking.groupBy({ by: ["expertId"], _count: { _all: true } });
  const bookingsBySlug = new Map(counts.map((c) => [c.expertId, c._count._all]));

  const rows: ExpertRow[] = experts.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    credentials: e.credentials,
    experienceYears: e.experienceYears,
    languages: parseList(e.languages),
    specialties: parseList(e.specialties),
    price: e.price,
    rating: e.rating,
    photo: e.photo,
    bio: e.bio,
    status: e.status,
    sortOrder: e.sortOrder,
    bookings: bookingsBySlug.get(e.slug) ?? 0,
  }));

  return (
    <main className="wrap-wide pb-28">
      <p className="eyebrow">provider directory</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Experts</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        The therapists behind matching, booking and every card on the site. Changes here are live
        immediately. Hiding takes someone off the site while their sessions and notes stay intact —
        that is the safe way to retire a listing.
      </p>

      <ExpertManager rows={rows} />
    </main>
  );
}
