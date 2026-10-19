import { record } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { INVITE_TTL_HOURS } from "@/lib/password-reset";
import { inviteExpertLogin } from "@/lib/expert-access";
import {
  clientKey,
  errors,
  fail,
  isSameOrigin,
  logFailure,
  privateJson,
  readJson,
} from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Giving a listing a way in, and taking it away again.
 *
 * A therapist on this site is two records that have to agree: the `Expert`
 * row the public books, and a `User` with role EXPERT joined to it by
 * `ExpertProfile`. Creating only the first is what the admin screen used to
 * do, and it produces a practitioner who is bookable by clients and cannot
 * see a single one of those bookings.
 *
 * WHY AN INVITE AND NOT A PASSWORD: an admin who types a colleague's password
 * knows it, and in practice sends it over WhatsApp, where it stays. The link
 * below is single-use, expires, and is spent by /api/auth/reset — which sets
 * the password, marks the address confirmed (reading the mail proved it) and
 * signs them in. Nobody at Emoraa ever holds an expert's password.
 *
 * The invite is also the reason the account is created with an unusable
 * password rather than a memorable one: until the link is spent there is no
 * string that opens this account, so a half-finished invite is not a door.
 */

/** The expert listing, and whoever can currently sign in as it. */
async function loadPair(expertId: string) {
  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    select: { id: true, slug: true, name: true },
  });
  if (!expert) return null;

  /*
   * Joined on the SLUG, not on Expert.id.
   *
   * The slug is what everything else in the system means by "which
   * practitioner": bookings store it, availability rules store it, and
   * getExpert() looks up by it. Linking a profile by the row's cuid instead
   * produces an account that signs in, shows the right name, and finds none of
   * its own sessions — because the bookings are filed under a different
   * string.
   */
  const profile = await prisma.expertProfile.findUnique({
    where: { expertId: expert.slug },
    select: {
      id: true,
      user: {
        select: { id: true, email: true, name: true, role: true, emailVerified: true },
      },
    },
  });
  return { expert, profile };
}

/**
 * POST — create the account if it doesn't exist, then email a set-password
 * link. Called again for the same listing, it re-sends: the old token is
 * dropped by `issueInviteToken`, so a resent invite invalidates the first.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const limited = await rateLimit("adminInvite", `admin:${session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const pair = await loadPair(params.id);
    if (!pair) return errors.notFound("That listing no longer exists.");
    const { expert } = pair;

    const body = await readJson<{ email?: string }>(req);
    const outcome = await inviteExpertLogin(expert, body?.email ?? "");

    if (!outcome.ok) {
      return outcome.code === "INVALID_EMAIL"
        ? errors.validation({ email: outcome.message })
        : fail(409, outcome.message, { code: outcome.code });
    }

    await record(
      session,
      "expert.access.invite",
      { type: "expert", id: expert.slug },
      `${outcome.resent ? "Re-sent" : "Sent"} a login invite for ${expert.name} to ${outcome.email}`,
      { delivered: outcome.delivered, via: outcome.via }
    );

    return privateJson({
      ok: true,
      email: outcome.email,
      delivered: outcome.delivered,
      via: outcome.via,
      expiresInHours: INVITE_TTL_HOURS,
      // only ever populated off production, by lib/email
      devLink: outcome.devLink,
    });
  } catch (err) {
    logFailure("admin.experts.access.post", err);
    return errors.server();
  }
}

/**
 * DELETE — take the login away.
 *
 * This unlinks the account from the listing and drops any unspent invite. It
 * does NOT delete the user: their name is on past sessions and notes, and a
 * deleted row there would orphan clinical records. The listing stays exactly
 * as it is and is still bookable — which is the point, because a practitioner
 * leaving should not silently empty the catalogue.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const pair = await loadPair(params.id);
    if (!pair) return errors.notFound("That listing no longer exists.");
    if (!pair.profile) return errors.notFound("That listing has no login to remove.");

    const userId = pair.profile.user.id;
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.expertProfile.delete({ where: { id: pair.profile.id } }),
      // sessions issued before this moment stop being accepted, so a
      // practitioner already signed in is out on their next request
      prisma.user.update({ where: { id: userId }, data: { passwordChangedAt: new Date() } }),
    ]);

    await record(
      session,
      "expert.access.revoke",
      { type: "expert", id: pair.expert.slug },
      `Removed ${pair.profile.user.email}'s access to ${pair.expert.name}`
    );

    return privateJson({ ok: true, email: pair.profile.user.email });
  } catch (err) {
    logFailure("admin.experts.access.delete", err);
    return errors.server();
  }
}
