import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { validateExpert, type ExpertDraft } from "@/lib/expert-admin";
import { refreshExpertPages } from "@/lib/expert-cache";
import { errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: errors.unauthenticated() };
  if (session.role !== "ADMIN") return { error: errors.forbidden() };
  return { session };
}

/**
 * PATCH /api/admin/experts/:id — change a listing.
 *
 * The slug is deliberately not editable: it is the id every past booking
 * carries, and rewriting it would orphan that history.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    const draft = await readJson<ExpertDraft>(req);
    if (!draft) return errors.badBody();

    const fields = validateExpert(draft);
    if (Object.keys(fields).length) return errors.validation(fields);

    const existing = await prisma.expert.findUnique({ where: { id: params.id } });
    if (!existing) return errors.notFound("That therapist is no longer in the catalogue.");

    await prisma.expert.update({
      where: { id: params.id },
      data: {
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
    return privateJson({ ok: true });
  } catch (err) {
    logFailure("admin.experts.update", err);
    return errors.server();
  }
}

/**
 * DELETE /api/admin/experts/:id — remove a listing for good.
 *
 * Refused for anyone with sessions in the record: their bookings, payments and
 * clinical notes point at this id, and a listing that vanishes takes the
 * meaning of that history with it. Hiding does the same job safely.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    const expert = await prisma.expert.findUnique({ where: { id: params.id } });
    if (!expert) return errors.notFound("That therapist is no longer in the catalogue.");

    const bookings = await prisma.booking.count({ where: { expertId: expert.slug } });
    if (bookings > 0) {
      return fail(
        409,
        `${expert.name} has ${bookings} session${bookings === 1 ? "" : "s"} on record, so the listing can't be deleted. Hide it instead — it disappears from the site and the history stays intact.`,
        { code: "EXPERT_HAS_BOOKINGS", bookings }
      );
    }

    await prisma.expert.delete({ where: { id: params.id } });
    refreshExpertPages();
    return privateJson({ ok: true });
  } catch (err) {
    logFailure("admin.experts.delete", err);
    return errors.server();
  }
}
