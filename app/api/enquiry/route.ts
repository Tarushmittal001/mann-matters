import { sendPackEnquiry, type PackEnquiry } from "@/lib/email";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { headcounts, pillars, segments } from "@/lib/organisations";
import { collect, hasErrors, validateEmail, validateName, validatePhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/enquiry — an institution asks for a program pack.
 *
 * Business contact details, not health data, so this is lighter than the booking
 * routes. It still gets the same envelope, the same same-origin check, and a
 * rate limit, because an open mail-sending endpoint is an open relay in waiting.
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
};

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const limited = rateLimit("enquiry", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const institution = (body.institution ?? "").trim();
    const contactName = (body.contactName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const phone = (body.phone ?? "").trim();
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
      ["phone", validatePhone(phone)],
      [
        "message",
        message.length > MESSAGE_MAX ? `Please keep this under ${MESSAGE_MAX} characters.` : null,
      ],
    ]);
    if (hasErrors(fields)) return errors.validation(fields);

    const enquiry: PackEnquiry = {
      institution,
      segment: segment!.name,
      headcount: headcount!,
      components,
      contactName,
      email,
      phone: phone || undefined,
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
