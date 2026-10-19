import { guessProfession } from "@/lib/professions";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { listAllExperts } from "@/lib/experts-store";
import ExpertManager, { type ExpertRow } from "@/components/admin/ExpertManager";

export const metadata: Metadata = { title: "Experts | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** The stored { slug: rupees } map, ignoring anything that isn't a real amount. */
const parsePrices = (raw: string): Record<string, number> => {
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    return Object.fromEntries(
      Object.entries(v).filter(
        ([, amount]) => typeof amount === "number" && Number.isInteger(amount) && amount >= 0
      )
    ) as Record<string, number>;
  } catch {
    return {};
  }
};

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

  /* Who can actually sign in as each listing. A listing without this is
     bookable by clients and invisible to the practitioner it names, which is
     the one state the admin screen never used to show. */
  const links = await prisma.expertProfile.findMany({
    select: {
      expertId: true,
      user: {
        select: {
          email: true,
          emailVerified: true,
          // an unspent, unexpired invite is the only thing that makes
          // "Invite sent" true. Inferring it from an unconfirmed address said
          // the same words about an account nobody had ever written to.
          passwordResets: { where: { expiresAt: { gt: new Date() } }, select: { id: true } },
        },
      },
    },
  });
  const accessByExpertId = new Map(links.map((l) => [l.expertId, l.user]));

  const rows: ExpertRow[] = experts.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    credentials: e.credentials,
    profession: e.profession || guessProfession(e.credentials),
    registrationNo: e.registrationNo,
    registrationBody: e.registrationBody ?? "",
    experienceYears: e.experienceYears,
    languages: parseList(e.languages),
    specialties: parseList(e.specialties),
    services: parseList(e.services),
    servicePrices: parsePrices(e.servicePrices),
    price: e.price,
    rating: e.rating,
    photo: e.photo,
    bio: e.bio,
    status: e.status,
    sortOrder: e.sortOrder,
    bookings: bookingsBySlug.get(e.slug) ?? 0,
    access: ((): ExpertRow["access"] => {
      // keyed by slug, because that is what ExpertProfile.expertId holds —
      // the same string bookings and availability are filed under
      const user = accessByExpertId.get(e.slug);
      if (!user) return { state: "none", email: "" };
      // spending the invite confirms the address, so a confirmed one means
      // they have been in
      if (user.emailVerified) return { state: "active", email: user.email };
      if (user.passwordResets.length) return { state: "invited", email: user.email };
      // an account on an address nobody has ever written to: it exists, and
      // there is no evidence anyone can read the inbox it is named after
      return { state: "unconfirmed", email: user.email };
    })(),
  }));

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">provider directory</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Experts</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        The therapists behind matching, booking and every card on the site. Changes here are live
        immediately. Hiding takes someone off the site while their sessions and notes stay intact —
        that is the safe way to retire a listing.
      </p>

      <ExpertManager rows={rows} />
    </section>
  );
}
