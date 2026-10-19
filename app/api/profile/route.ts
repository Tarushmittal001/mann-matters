import { prisma } from "@/lib/db";
import { createSession, getSession } from "@/lib/auth";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import {
  collect,
  hasErrors,
  normalisePhone,
  dobString,
  validateCity,
  validateDateOfBirth,
  validateGender,
  validateName,
  validateNotes,
  validateOrganisation,
  validateRequiredPhone,
  validateState,
} from "@/lib/validation";
import { languageOpts } from "@/lib/matching";

export const dynamic = "force-dynamic";

/**
 * A date of birth is fixed once they have booked. It decided whether a guardian
 * had to agree to that booking, so changing it afterwards would rewrite the
 * basis of a consent already relied on — and turning 18 on paper is exactly the
 * edit someone might make to skip that step. Before any booking it can still be
 * corrected; an account made before we asked can always add one.
 */
async function dobLocked(userId: string, dateOfBirth: Date | null): Promise<boolean> {
  if (!dateOfBirth) return false;
  return (await prisma.booking.count({ where: { userId } })) > 0;
}

/** Columns a person may see about themselves. `passwordHash` is not among them. */
const PROFILE_SELECT = {
  id: true,
  name: true,
  dateOfBirth: true,
  gender: true,
  city: true,
  state: true,
  avatar: true,
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
        dateOfBirth: dobString(user.dateOfBirth),
        dateOfBirthLocked: await dobLocked(user.id, user.dateOfBirth),
        gender: user.gender ?? "",
        city: user.city ?? "",
        state: user.state ?? "",
        avatar: user.avatar,
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
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
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
    const dateOfBirth = (body.dateOfBirth ?? "").trim();
    const gender = (body.gender ?? "").trim();
    const city = (body.city ?? "").trim();
    const state = (body.state ?? "").trim();
    const organisation = (body.organisation ?? "").trim();
    const phoneRaw = (body.phone ?? "").trim();
    const language = (body.language ?? "").trim();
    const notes = (body.notes ?? "").trim();

    const fields = collect([
      ["name", validateName(name)],
      // date of birth and gender are asked at signup, so they can be corrected but not blanked
      ["dateOfBirth", validateDateOfBirth(dateOfBirth)],
      ["gender", validateGender(gender)],
      // asked at signup, so these can be corrected when somebody moves but not blanked
      ["city", validateCity(city)],
      ["state", validateState(state)],
      ["organisation", validateOrganisation(organisation)],
      // required, as at signup — a session change has to reach somebody
      ["phone", validateRequiredPhone(phoneRaw)],
      ["notes", validateNotes(notes)],
    ]);
    if (language && !languageOpts.includes(language)) {
      fields.language = "Please choose one of the listed languages.";
    }
    if (hasErrors(fields)) return errors.validation(fields);

    const current = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { phone: true, dateOfBirth: true },
    });
    if (!current) return errors.notFound("We couldn't find your account.");

    if (dobString(current.dateOfBirth) !== dateOfBirth && (await dobLocked(session.sub, current.dateOfBirth))) {
      return errors.validation({
        dateOfBirth: "Your date of birth can't be changed after you've booked. Write to us if it's wrong.",
      });
    }

    // validation above guarantees it is present and well-formed
    const phone = normalisePhone(phoneRaw);
    const user = await prisma.user.update({
      where: { id: session.sub },
      data: {
        name,
        dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`),
        gender,
        city,
        state,
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
        dateOfBirth: dobString(user.dateOfBirth),
        dateOfBirthLocked: await dobLocked(user.id, user.dateOfBirth),
        gender: user.gender ?? "",
        city: user.city ?? "",
        state: user.state ?? "",
        avatar: user.avatar,
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
