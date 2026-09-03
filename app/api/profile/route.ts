import { prisma } from "@/lib/db";
import { createSession, getSession } from "@/lib/auth";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import {
  collect,
  hasErrors,
  normalisePhone,
  validateName,
  validateNotes,
  validatePhone,
} from "@/lib/validation";
import { languageOpts } from "@/lib/matching";

export const dynamic = "force-dynamic";

/** Columns a person may see about themselves. `passwordHash` is not among them. */
const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  language: true,
  notes: true,
  role: true,
  emailVerified: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: PROFILE_SELECT,
    });
    if (!user) return errors.notFound("We couldn't find your account.");

    return privateJson({
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        language: user.language ?? "",
        notes: user.notes ?? "",
        emailVerified: !!user.emailVerified,
        memberSince: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logFailure("profile.get", err);
    return errors.server();
  }
}

type Body = { name?: string; phone?: string; language?: string; notes?: string };

/**
 * PATCH /api/profile
 *
 * Name, phone, preferred language, and a private note for the therapist.
 *
 * Email is deliberately NOT editable here: changing it would need a fresh
 * verification round-trip, and allowing it silently would let a hijacked session
 * lock the real owner out of their own account.
 */
export async function PATCH(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const name = (body.name ?? "").trim();
    const phoneRaw = (body.phone ?? "").trim();
    const language = (body.language ?? "").trim();
    const notes = (body.notes ?? "").trim();

    const fields = collect([
      ["name", validateName(name)],
      ["phone", validatePhone(phoneRaw)],
      ["notes", validateNotes(notes)],
    ]);
    if (language && !languageOpts.includes(language)) {
      fields.language = "Please choose one of the listed languages.";
    }
    if (hasErrors(fields)) return errors.validation(fields);

    const user = await prisma.user.update({
      where: { id: session.sub },
      data: {
        name,
        phone: phoneRaw ? normalisePhone(phoneRaw) : null,
        language: language || null,
        notes: notes || null,
      },
      select: PROFILE_SELECT,
    });

    // the session carries the display name, so re-issue it or the nav goes stale
    if (user.name !== session.name) {
      await createSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    return privateJson({
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        language: user.language ?? "",
        notes: user.notes ?? "",
        emailVerified: !!user.emailVerified,
        memberSince: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logFailure("profile.update", err);
    return errors.server();
  }
}
