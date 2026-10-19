import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendExpertInviteEmail } from "@/lib/email";
import { INVITE_TTL_HOURS, issueInviteToken } from "@/lib/password-reset";
import { site } from "@/lib/site";

/**
 * Giving a practitioner a way in.
 *
 * Lives here rather than in a route because two screens now do it: the "Add a
 * therapist" form, which sets up the listing and the login together, and the
 * Manage dialog on an existing card. Those two must agree about who may be
 * invited and what happens to an address already in use — a second copy of
 * these rules is a second place for them to rot.
 *
 * Returns a plain result rather than a Response, so each caller decides what
 * an outcome means for it. Creating a listing and failing to invite is not the
 * same failure as failing to re-send an invite: the first still leaves a
 * perfectly good listing behind, and refusing to save it over an email typo
 * would be the wrong trade.
 */

export type InviteOutcome =
  | { ok: true; email: string; delivered: boolean; via: string; devLink?: string; resent: boolean }
  | { ok: false; code: "INVALID_EMAIL" | "ALREADY_LINKED" | "EMAIL_IN_USE"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function inviteExpertLogin(
  /** The listing. `slug` is what ExpertProfile joins on — never the cuid. */
  expert: { slug: string; name: string },
  typedEmail: string
): Promise<InviteOutcome> {
  const profile = await prisma.expertProfile.findUnique({
    where: { expertId: expert.slug },
    select: { user: { select: { id: true, email: true } } },
  });

  const typed = typedEmail.trim().toLowerCase();
  // re-sending needs no address: the account already has one
  const email = typed || profile?.user.email || "";

  if (!email || !EMAIL_RE.test(email)) {
    return {
      ok: false,
      code: "INVALID_EMAIL",
      message: email ? "That doesn't look like an email address." : "An email address is needed.",
    };
  }

  if (profile && typed && typed !== profile.user.email) {
    // moving the address on a live account moves who can reach the password
    // link — a different and riskier act than inviting, so it is refused here
    return {
      ok: false,
      code: "ALREADY_LINKED",
      message: `${expert.name} already signs in as ${profile.user.email}.`,
    };
  }

  let userId = profile?.user.id ?? null;

  if (!userId) {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, expertProfile: { select: { expertId: true } } },
    });

    if (existing) {
      /* An address already in use must never be quietly repurposed: it may
         belong to a client of this practice, and turning their account into a
         practitioner would hand them the clinical side of the site. */
      if (existing.role !== "EXPERT") {
        return {
          ok: false,
          code: "EMAIL_IN_USE",
          message: `${email} is already ${
            existing.role === "ADMIN" ? "an admin" : "a client"
          } account here. Use a different address for the practitioner login.`,
        };
      }
      if (existing.expertProfile) {
        return {
          ok: false,
          code: "EMAIL_IN_USE",
          message: `${email} is already linked to another listing.`,
        };
      }
      userId = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          name: expert.name,
          email,
          // unusable until the invite is spent: 32 random bytes, hashed and
          // thrown away, so no string opens this account yet
          passwordHash: await hashPassword(randomBytes(32).toString("hex")),
          role: "EXPERT",
        },
        select: { id: true },
      });
      userId = created.id;
    }

    /* Joined on the SLUG. That is what bookings, availability rules and
       getExpert() all use; a profile joined by the Expert row's cuid signs in
       fine and then finds none of its own sessions. */
    await prisma.expertProfile.create({ data: { userId, expertId: expert.slug } });
  }

  const token = await issueInviteToken(userId);
  const link = `${site.url}/reset-password?token=${token}&welcome=1`;
  const result = await sendExpertInviteEmail(email, expert.name, link, INVITE_TTL_HOURS);

  return {
    ok: true,
    email,
    delivered: result.delivered,
    via: result.via,
    devLink: result.devLink,
    resent: !!profile,
  };
}
