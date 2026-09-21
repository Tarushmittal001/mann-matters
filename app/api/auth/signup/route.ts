import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { prove } from "@/lib/contact-verification";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail, type DeliveryResult } from "@/lib/email";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import {
  collect,
  hasErrors,
  normalisePhone,
  validateAge,
  validateEmail,
  validateGender,
  validateNamePart,
  validateOrganisation,
  validatePassword,
  validateRequiredPhone,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/signup
 *
 * An account is a person we may end up treating, so it carries a name, age,
 * gender and a mobile number we have actually reached. The number is proven by
 * SMS code before the account exists (lib/contact-verification):
 *
 *   1. everything but the code      → 202 { needsCode, phoneToken }, code texted
 *   2. the same, plus token + code  → 201, account created, email link sent
 *
 * The email is confirmed afterwards by its own link, as before: asking for two
 * codes before someone has an account is one hurdle too many.
 */

type Body = {
  firstName?: string;
  lastName?: string;
  age?: string;
  gender?: string;
  organisation?: string;
  email?: string;
  phone?: string;
  password?: string;
  phoneToken?: string;
  phoneCode?: string;
};

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const limited = rateLimit("signup", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const ageRaw = (body.age ?? "").trim();
    const gender = (body.gender ?? "").trim();
    const organisation = (body.organisation ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const phoneRaw = (body.phone ?? "").trim();
    const password = body.password ?? "";

    const fields = collect([
      ["firstName", validateNamePart(firstName, "first")],
      ["lastName", validateNamePart(lastName, "last")],
      ["age", validateAge(ageRaw)],
      ["gender", validateGender(gender)],
      ["organisation", validateOrganisation(organisation)],
      ["email", validateEmail(email)],
      ["phone", validateRequiredPhone(phoneRaw)],
      ["password", validatePassword(password)],
    ]);
    if (hasErrors(fields)) return errors.validation(fields);

    const name = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
    const phone = normalisePhone(phoneRaw);

    // both checked before a code is sent, so nobody burns an SMS on a taken address
    const [byEmail, byPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { phone } }),
    ]);
    if (byEmail) {
      // this one does reveal that an address is taken — the alternative is
      // people who already have an account being unable to work out why signup
      // "worked" but login doesn't. The message points at the recovery path.
      return errors.validation(
        { email: "An account with this email already exists. Try signing in." },
        "An account with this email already exists."
      );
    }
    if (byPhone) {
      return errors.validation(
        { phone: "That mobile number is already linked to an account. Try signing in." },
        "That mobile number is already registered."
      );
    }

    const proof = await prove({
      channel: "phone",
      value: phone,
      name: firstName,
      ip: clientKey(req),
      token: body.phoneToken,
      code: body.phoneCode,
    });
    if (proof.state === "blocked") return proof.response;
    if (proof.state === "wrong") return errors.validation({ phoneCode: proof.message });
    if (proof.state === "sent") {
      return privateJson(
        { ok: true, needsCode: true, phoneToken: proof.token, devPhoneCode: proof.devCode },
        { status: 202 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        firstName,
        lastName,
        age: Number(ageRaw),
        gender,
        organisation: organisation || null,
        email,
        phone,
        // the code they just entered is the proof
        phoneVerified: new Date(),
        passwordHash: await hashPassword(password),
      },
    });

    // a verification link, and no session until they follow it
    const token = await issueVerificationToken(user.id);
    const link = `${new URL(req.url).origin}/verify?token=${token}`;

    let delivery: DeliveryResult | null = null;
    try {
      delivery = await sendVerificationEmail(user.email, user.firstName ?? user.name, link);
    } catch (err) {
      // a mailer hiccup shouldn't lose the account they just made — they can resend
      logFailure("auth.signup.email", err);
    }

    return privateJson({
      pendingVerification: true,
      email: user.email,
      // false when no provider is configured, so the screen can say so plainly
      // rather than telling someone to check an inbox nothing was sent to
      emailSent: delivery?.delivered ?? false,
      // development only — `sendVerificationEmail` returns this exclusively when
      // NODE_ENV !== "production" and no mailer is wired up
      devLink: delivery?.devLink,
    });
  } catch (err) {
    const prismaError = err as { code?: string };
    if (prismaError?.code === "P2002") {
      return errors.validation({ email: "That email or mobile number is already registered." });
    }
    logFailure("auth.signup", err);
    return errors.server();
  }
}
