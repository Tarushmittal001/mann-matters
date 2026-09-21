import { prove } from "@/lib/contact-verification";
import { sendPackEnquiry, type PackEnquiry } from "@/lib/email";
import { clientKey, errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { headcounts, pillars, segments } from "@/lib/organisations";
import {
  collect,
  hasErrors,
  normalisePhone,
  validateEmail,
  validateName,
  validateRequiredPhone,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/enquiry — an institution asks for a program pack.
 *
 * Business contact details, not health data, so this is lighter than the booking
 * routes. It still gets the same envelope, the same same-origin check, and a
 * rate limit, because an open mail-sending endpoint is an open relay in waiting.
 *
 * Both the email and the phone number must be proven (lib/contact-verification),
 * so nobody can put a school's name and someone else's details on a brief:
 *
 *   1. the brief                                   → 202 { emailToken?, phoneToken? }, codes sent
 *   2. the brief + emailToken/emailCode + phoneToken/phoneCode → 200, brief sent
 *
 * Anything already proven in this browser (or on a signed-in account) is
 * skipped, so a wrong phone code never costs the email code already accepted.
 *
 * The segment and component values are validated against `lib/organisations.ts`
 * rather than trusted, so nothing arbitrary can be injected into the email we
 * send ourselves.
 */

const MESSAGE_MAX = 1200;
const INSTITUTION_MAX = 120;

type Body = {
  institution?: string;
  segment?: string;
  headcount?: string;
  components?: unknown;
  contactName?: string;
  email?: string;
  phone?: string;
  message?: string;
  emailToken?: string;
  emailCode?: string;
  phoneToken?: string;
  phoneCode?: string;
};

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const institution = (body.institution ?? "").trim();
    const contactName = (body.contactName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const rawPhone = (body.phone ?? "").trim();
    const message = (body.message ?? "").trim();

    // only ids we actually publish are accepted
    const segment = segments.find((s) => s.id === body.segment);
    const headcount = headcounts.find((h) => h === body.headcount);
    const requested = Array.isArray(body.components) ? body.components : [];
    const components = pillars
      .filter((p) => requested.includes(p.id))
      .map((p) => p.title);

    const fields = collect([
      [
        "institution",
        !institution
          ? "Please tell us which institution this is for."
          : institution.length > INSTITUTION_MAX
            ? `Please keep this under ${INSTITUTION_MAX} characters.`
            : null,
      ],
      ["segment", segment ? null : "Please choose the kind of institution."],
      ["headcount", headcount ? null : "Please choose an approximate size."],
      ["contactName", validateName(contactName)],
      ["email", validateEmail(email)],
      ["phone", validateRequiredPhone(rawPhone)],
      [
        "message",
        message.length > MESSAGE_MAX ? `Please keep this under ${MESSAGE_MAX} characters.` : null,
      ],
    ]);
    if (hasErrors(fields)) return errors.validation(fields);

    const phone = normalisePhone(rawPhone);
    const ip = clientKey(req);

    // both proofs run every time, so each channel moves forward on its own
    const emailProof = await prove({
      channel: "email",
      value: email,
      name: contactName,
      ip,
      token: body.emailToken,
      code: body.emailCode,
    });
    if (emailProof.state === "blocked") return emailProof.response;

    const phoneProof = await prove({
      channel: "phone",
      value: phone,
      name: contactName,
      ip,
      token: body.phoneToken,
      code: body.phoneCode,
    });
    if (phoneProof.state === "blocked") return phoneProof.response;

    const verified = {
      email: emailProof.state === "verified",
      phone: phoneProof.state === "verified",
    };

    if (emailProof.state === "wrong" || phoneProof.state === "wrong") {
      return fail(422, "Please check the highlighted code.", {
        code: "VALIDATION",
        fields: {
          ...(emailProof.state === "wrong" ? { emailCode: emailProof.message } : {}),
          ...(phoneProof.state === "wrong" ? { phoneCode: phoneProof.message } : {}),
        },
        verified,
        // a code the other channel just sent must not be lost with this error
        emailToken: emailProof.state === "sent" ? emailProof.token : undefined,
        phoneToken: phoneProof.state === "sent" ? phoneProof.token : undefined,
        devEmailCode: emailProof.state === "sent" ? emailProof.devCode : undefined,
        devPhoneCode: phoneProof.state === "sent" ? phoneProof.devCode : undefined,
      });
    }

    if (emailProof.state === "sent" || phoneProof.state === "sent") {
      return privateJson(
        {
          ok: true,
          needsCode: true,
          verified,
          emailToken: emailProof.state === "sent" ? emailProof.token : undefined,
          phoneToken: phoneProof.state === "sent" ? phoneProof.token : undefined,
          devEmailCode: emailProof.state === "sent" ? emailProof.devCode : undefined,
          devPhoneCode: phoneProof.state === "sent" ? phoneProof.devCode : undefined,
        },
        { status: 202 }
      );
    }

    const limited = rateLimit("enquiry", ip);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const enquiry: PackEnquiry = {
      institution,
      segment: segment!.name,
      headcount: headcount!,
      components,
      contactName,
      email,
      phone,
      message: message || undefined,
    };

    const result = await sendPackEnquiry(enquiry);

    return privateJson({
      ok: true,
      // false only when no mail provider is configured at all
      delivered: result.delivered,
      // development convenience, mirroring the signup flow
      devFallback: result.devFallback,
    });
  } catch (err) {
    logFailure("enquiry", err);
    return errors.server();
  }
}
