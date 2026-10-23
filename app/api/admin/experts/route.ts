import { prisma } from "@/lib/db";
import { record } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { slugify, validateExpert, type ExpertDraft } from "@/lib/expert-admin";
import { services } from "@/lib/services";
import { refreshExpertPages } from "@/lib/expert-cache";
import { inviteExpertLogin } from "@/lib/expert-access";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
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

/** POST /api/admin/experts — add a therapist to the catalogue. */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const draft = await readJson<ExpertDraft>(req);
    if (!draft) return errors.badBody();

    const fields = validateExpert(draft, { creating: true });
    if (Object.keys(fields).length) return errors.validation(fields);

    // the slug is the id bookings will carry forever, so it is made once and
    // nudged rather than overwritten if the name is already taken
    const base = slugify(draft.name);
    let slug = base;
    for (let n = 2; await prisma.expert.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

    /*
     * The two fields that decide what can be sold and for how much, cleaned
     * server-side. A slug not in the catalogue is dropped rather than stored:
     * this list is the qualification gate, and a typo must not invent a
     * service somebody can then be booked for.
     */
    const cleared = (draft.services ?? []).filter((slug) =>
      services.some((s) => s.slug === slug)
    );

    const expert = await prisma.expert.create({
      data: {
        slug,
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

    refreshExpertPages();
    await record(
      session,
      "expert.create",
      { type: "expert", id: slug },
      `Added ${expert.name} to the catalogue`,
      { services: cleared, status: draft.status }
    );

    /*
     * The login, if one was asked for, in the same act as the listing.
     *
     * A failure here does NOT fail the create. The listing is already saved
     * and perfectly good; refusing it over an email typo would throw away
     * everything else the admin just typed. So the outcome is reported back
     * and the card shows "No login" until it is sorted from Manage.
     */
    let invite: { sent: boolean; email?: string; delivered?: boolean; problem?: string } = {
      sent: false,
    };
    const wantsLogin = (draft.loginEmail ?? "").trim();
    if (wantsLogin) {
      const outcome = await inviteExpertLogin({ slug, name: expert.name }, wantsLogin);
      if (outcome.ok) {
        invite = { sent: true, email: outcome.email, delivered: outcome.delivered };
        await record(
          session,
          "expert.access.invite",
          { type: "expert", id: slug },
          `Sent a login invite for ${expert.name} to ${outcome.email}`,
          { delivered: outcome.delivered, via: outcome.via, withCreate: true }
        );
      } else {
        invite = { sent: false, problem: outcome.message };
      }
    }

    return privateJson({ ok: true, id: expert.id, slug: expert.slug, invite }, { status: 201 });
  } catch (err) {
    logFailure("admin.experts.create", err);
    return errors.server();
  }
}
