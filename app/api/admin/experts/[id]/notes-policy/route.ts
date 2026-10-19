import { record } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NOTES_POLICY_COPY, NOTES_POLICY_NOTE_MAX, isNotesPolicy } from "@/lib/expert-portal";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/experts/:id/notes-policy — { policy, note }
 *
 * Whether a practitioner may keep session notes in the portal. Until an admin
 * moves this to APPROVED the notes field does not exist for them and the note
 * route answers 403 (`canWriteNotes`). It is a clinical-governance decision,
 * so it is an admin's alone and every change lands in the audit trail.
 *
 * The policy lives on ExpertProfile, which exists only once the listing has a
 * login — a listing nobody can sign in as has nobody to clear. `note` is shown
 * to the practitioner on their profile page, so it is written to them.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const body = await readJson<{ policy?: string; note?: string }>(req);
    if (!body) return errors.badBody();

    const policy = body.policy;
    const note = (body.note ?? "").trim();
    if (!isNotesPolicy(policy)) {
      return errors.validation({ policy: "Choose enabled, pending or held elsewhere." });
    }
    if (note.length > NOTES_POLICY_NOTE_MAX) {
      return errors.validation({ note: `Keep this under ${NOTES_POLICY_NOTE_MAX} characters.` });
    }

    const expert = await prisma.expert.findUnique({
      where: { id: params.id },
      select: { slug: true, name: true },
    });
    if (!expert) return errors.notFound("That listing no longer exists.");

    // joined on the slug — see /api/admin/experts/[id]/access for why
    const profile = await prisma.expertProfile.findUnique({
      where: { expertId: expert.slug },
      select: { id: true, notesPolicy: true },
    });
    if (!profile) {
      return errors.notFound("Give this listing a login first — there is nobody to clear yet.");
    }

    await prisma.expertProfile.update({
      where: { id: profile.id },
      data: { notesPolicy: policy, notesPolicyNote: note },
    });

    const from = isNotesPolicy(profile.notesPolicy) ? profile.notesPolicy : "PENDING";
    await record(
      session,
      "expert.notes-policy",
      { type: "expert", id: expert.slug },
      `Note-keeping for ${expert.name}: ${NOTES_POLICY_COPY[from].short} → ${NOTES_POLICY_COPY[policy].short}`,
      { from, to: policy }
    );

    return privateJson({ ok: true, policy, note });
  } catch (err) {
    logFailure("admin.experts.notes-policy", err);
    return errors.server();
  }
}
