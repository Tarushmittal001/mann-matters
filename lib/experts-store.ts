import { prisma } from "@/lib/db";
import { seedExperts, type Expert } from "@/lib/experts";

/**
 * The therapist catalogue, read from the database.
 *
 * The site used to ship this list in a file, so adding a therapist meant a code
 * change and a deploy. It lives in the database now and an admin edits it from
 * /admin/experts; the shape handed back is unchanged, so matching, booking and
 * every card carry on working as they did.
 *
 * On a database with no experts yet (a fresh machine, or the first run after
 * this change) the six originals are inserted once, so nothing ever renders an
 * empty list.
 */

export const EXPERT_STATUS = { active: "ACTIVE", hidden: "HIDDEN" } as const;

type Row = {
  slug: string;
  name: string;
  credentials: string;
  experienceYears: number;
  languages: string;
  specialties: string;
  price: number;
  rating: number;
  photo: string;
  bio: string;
  status: string;
  sortOrder: number;
};

const parseList = (raw: string): string[] => {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
};

/** A stored row in the shape the rest of the site already expects. */
export function toExpert(row: Row): Expert {
  return {
    id: row.slug,
    name: row.name,
    credentials: row.credentials,
    experience: row.experienceYears === 1 ? "1 year" : `${row.experienceYears} years`,
    languages: parseList(row.languages),
    specialties: parseList(row.specialties),
    price: row.price,
    rating: row.rating,
    photo: row.photo,
  };
}

/** "9 years" → 9, for importing the originals and for the admin form. */
export function yearsFrom(experience: string): number {
  const n = Number(String(experience).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  const count = await prisma.expert.count();
  if (count === 0) {
    await prisma.expert.createMany({
      data: seedExperts.map((e, i) => ({
        slug: e.id,
        name: e.name,
        credentials: e.credentials,
        experienceYears: yearsFrom(e.experience),
        languages: JSON.stringify(e.languages),
        specialties: JSON.stringify(e.specialties),
        price: e.price,
        rating: e.rating,
        photo: e.photo,
        sortOrder: i,
      })),
    });
  }
  seeded = true;
}

/** Everyone the public site should show, in the order an admin chose. */
export async function listExperts(): Promise<Expert[]> {
  await ensureSeeded();
  const rows = await prisma.expert.findMany({
    where: { status: EXPERT_STATUS.active },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toExpert);
}

/** Everyone, hidden ones included — the admin view. */
export async function listAllExperts() {
  await ensureSeeded();
  return prisma.expert.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getExpert(slug: string): Promise<Expert | null> {
  await ensureSeeded();
  const row = await prisma.expert.findUnique({ where: { slug } });
  return row ? toExpert(row) : null;
}

/** Bookings reference the slug, so a listing with history is hidden, never deleted. */
export async function expertBookingCount(slug: string): Promise<number> {
  return prisma.booking.count({ where: { expertId: slug } });
}
