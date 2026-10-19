import { prisma } from "@/lib/db";
import { record } from "@/lib/audit";
import { getSession, type Session } from "@/lib/auth";
import { validateExpert, type ExpertDraft } from "@/lib/expert-admin";
import { services } from "@/lib/services";
import { refreshExpertPages } from "@/lib/expert-cache";
import { errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { isRegisterBody } from "@/lib/professions";

/**
 * The rate map as it should be stored: overrides only, for services this
 * practitioner is actually cleared for.
 *
 * Blanks are dropped rather than written as 0 — an empty box means "charge the
 * standard price", and storing a zero there would quietly make the session
 * free. Rates for unticked services are dropped too, so unticking something
 * cannot leave a price behind that reappears if it is ever ticked again.
 */
function ratesFor(cleared: string[], typed: Record<string, string> | undefined) {
  const out: Record<string, number> = {};
  for (const slug of cleared) {
    const raw = (typed ?? {})[slug];
    if (raw === undefined || raw.trim() === "") continue;
    const amount = Number(raw);
    if (Number.isInteger(amount) && amount >= 0) out[slug] = amount;
  }
  return out;
}

export const dynamic = "force-dynamic";

/**
 * Typed as a discriminated union so `if (guard.error) return guard.error`
 * actually narrows: after that line the compiler knows `guard.session` is
 * there, and callers do not have to assert it away with a `!`.
 */
type AdminGuard =
  | { error: Response; session?: undefined }
  | { error?: undefined; session: Session };

async function requireAdmin(): Promise<AdminGuard> {
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
    const { session } = guard;

    const draft = await readJson<ExpertDraft>(req);
    if (!draft) return errors.badBody();

    const fields = validateExpert(draft);
    if (Object.keys(fields).length) return errors.validation(fields);

    const existing = await prisma.expert.findUnique({ where: { id: params.id } });
    if (!existing) return errors.notFound("That therapist is no longer in the catalogue.");

    /*
     * The list that decides what can be sold, cleaned server-side. A slug not
     * in the catalogue is dropped rather than stored: this is the
     * qualification gate, and a typo must not invent a service somebody can
     * then be booked for.
     */
    const cleared = (draft.services ?? []).filter((slug) =>
      services.some((s) => s.slug === slug)
    );

    await prisma.expert.update({
      where: { id: params.id },
      data: {
        name: draft.name.trim(),
        credentials: draft.credentials.trim(),
        // both checked by validateExpert above
        profession: draft.profession,
        registrationNo: (draft.registrationNo ?? "").trim(),
        // only a value from REGISTER_OPTIONS; anything else is dropped so a
        // crafted request cannot invent a register name on a public profile
        registrationBody: isRegisterBody((draft.registrationBody ?? "").trim())
          ? (draft.registrationBody ?? "").trim()
          : "",
        experienceYears: Number(draft.experienceYears),
        languages: JSON.stringify(draft.languages.map((v) => v.trim())),
        specialties: JSON.stringify(draft.specialties.map((v) => v.trim())),
        // Only slugs that are really in the catalogue: this list decides who a
        // client can be put in front of, so a typo must not create a service.
        services: JSON.stringify(cleared),
        servicePrices: JSON.stringify(ratesFor(cleared, draft.servicePrices)),
        price: Number(draft.price) || 0,
        rating: Number(draft.rating),
        photo: draft.photo.trim(),
        bio: draft.bio.trim(),
        status: draft.status,
        sortOrder: Number(draft.sortOrder || 0),
      },
    });

    /* Hiding and showing are the two edits worth telling apart in the trail:
       one takes a therapist off the site, the other puts them back. */
    const statusChanged = existing.status !== draft.status;
    await record(
      session,
      statusChanged ? (draft.status === "ACTIVE" ? "expert.show" : "expert.hide") : "expert.update",
      { type: "expert", id: existing.slug },
      statusChanged
        ? `${draft.status === "ACTIVE" ? "Listed" : "Hid"} ${existing.name}`
        : `Edited ${existing.name}`,
      statusChanged ? { from: existing.status, to: draft.status } : { services: cleared }
    );

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
    const { session } = guard;

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

    await record(
      session,
      "expert.delete",
      { type: "expert", id: expert.slug },
      `Deleted ${expert.name} from the catalogue`,
      { hadBookings: bookings }
    );
    refreshExpertPages();
    return privateJson({ ok: true });
  } catch (err) {
    logFailure("admin.experts.delete", err);
    return errors.server();
  }
}
