import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify, validateExpert, type ExpertDraft } from "@/lib/expert-admin";
import { refreshExpertPages } from "@/lib/expert-cache";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** POST /api/admin/experts — add a therapist to the catalogue. */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const draft = await readJson<ExpertDraft>(req);
    if (!draft) return errors.badBody();

    const fields = validateExpert(draft);
    if (Object.keys(fields).length) return errors.validation(fields);

    // the slug is the id bookings will carry forever, so it is made once and
    // nudged rather than overwritten if the name is already taken
    const base = slugify(draft.name);
    let slug = base;
    for (let n = 2; await prisma.expert.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

    const expert = await prisma.expert.create({
      data: {
        slug,
        name: draft.name.trim(),
        credentials: draft.credentials.trim(),
        experienceYears: Number(draft.experienceYears),
        languages: JSON.stringify(draft.languages.map((v) => v.trim())),
        specialties: JSON.stringify(draft.specialties.map((v) => v.trim())),
        price: Number(draft.price),
        rating: Number(draft.rating),
        photo: draft.photo.trim(),
        bio: draft.bio.trim(),
        status: draft.status,
        sortOrder: Number(draft.sortOrder || 0),
      },
    });

    refreshExpertPages();
    return privateJson({ ok: true, id: expert.id, slug: expert.slug }, { status: 201 });
  } catch (err) {
    logFailure("admin.experts.create", err);
    return errors.server();
  }
}
