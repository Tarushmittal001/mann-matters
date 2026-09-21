import { prisma } from "@/lib/db";
import { createSession, getSession } from "@/lib/auth";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import {
  collect,
  hasErrors,
  normalisePhone,
  validateAge,
  validateGender,
  validateName,
  validateNotes,
  validateOrganisation,
  validatePhone,
} from "@/lib/validation";
import { languageOpts } from "@/lib/matching";

export const dynamic = "force-dynamic";

/** Columns a person may see about themselves. `passwordHash` is not among them. */
const PROFILE_SELECT = {
  id: true,
  name: true,
  age: true,
  gender: true,
  organisation: true,
  email: true,
  phone: true,
  phoneVerified: true,
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
        age: user.age ? String(user.age) : "",
        gender: user.gender ?? "",
        organisation: user.organisation ?? "",
        email: user.email,
        phone: user.phone ?? "",
        phoneVerified: !!user.phoneVerified,
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

type Body = {
  name?: string;
  age?: string;
  gender?: string;
  organisation?: string;
  phone?: string;
  language?: string;
  notes?: string;
};

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
    const ageRaw = (body.age ?? "").trim();
    const gender = (body.gender ?? "").trim();
    const organisation = (body.organisation ?? "").trim();
    const phoneRaw = (body.phone ?? "").trim();
    const language = (body.language ?? "").trim();
    const notes = (body.notes ?? "").trim();

    const fields = collect([
      ["name", validateName(name)],
      // age and gender are asked at signup, so they can be corrected but not blanked
      ["age", validateAge(ageRaw)],
      ["gender", validateGender(gender)],
      ["organisation", validateOrganisation(organisation)],
      ["phone", validatePhone(phoneRaw)],
      ["notes", validateNotes(notes)],
    ]);
    if (language && !languageOpts.includes(language)) {
      fields.language = "Please choose one of the listed languages.";
    }
    if (hasErrors(fields)) return errors.validation(fields);

    const current = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { phone: true },
    });
    if (!current) return errors.notFound("We couldn't find your account.");

    const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
    const user = await prisma.user.update({
      where: { id: session.sub },
      data: {
        name,
        age: Number(ageRaw),
        gender,
        organisation: organisation || null,
        phone,
        phoneVerified: current.phone === phone ? undefined : null,
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
        age: user.age ? String(user.age) : "",
        gender: user.gender ?? "",
        organisation: user.organisation ?? "",
        email: user.email,
        phone: user.phone ?? "",
        phoneVerified: !!user.phoneVerified,
        language: user.language ?? "",
        notes: user.notes ?? "",
        emailVerified: !!user.emailVerified,
        memberSince: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    const prismaError = err as { code?: string; meta?: { target?: string[] | string } };
    if (prismaError?.code === "P2002") {
      return errors.validation({ phone: "That mobile number is linked to another account." });
    }
    logFailure("profile.update", err);
    return errors.server();
  }
}
