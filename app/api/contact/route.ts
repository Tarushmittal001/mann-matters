import { prove } from "@/lib/contact-verification";
import { sendContactMessage } from "@/lib/email";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { collect, hasErrors, validateEmail, validateName } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/contact — a visitor writes to us from the site.
 *
 * Used by the contact form and by the composer behind every published email
 * address. The address has to be proven first (see lib/contact-verification):
 *
 *   1. { name, email, message }               → 202 { needsCode, token }, code emailed
 *   2. { name, email, message, token, code }  → 200, message sent
 *
 * A browser that already verified this address, or a signed-in user writing
 * from their confirmed account email, goes straight to step 2's outcome.
 */

const MESSAGE_MIN = 5;
const MESSAGE_MAX = 3000;

type Body = { name?: string; email?: string; message?: string; token?: string; code?: string };

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const message = (body.message ?? "").trim();

    const fields = collect([
      ["name", validateName(name)],
      ["email", validateEmail(email)],
      [
        "message",
        message.length < MESSAGE_MIN
          ? "Please write a little more so we can help."
          : message.length > MESSAGE_MAX
            ? `Please keep this under ${MESSAGE_MAX} characters.`
            : null,
      ],
    ]);
    if (hasErrors(fields)) return errors.validation(fields);

    const ip = clientKey(req);
    const proof = await prove({ channel: "email", value: email, name, ip, token: body.token, code: body.code });

    if (proof.state === "blocked") return proof.response;
    if (proof.state === "wrong") return errors.validation({ code: proof.message });
    if (proof.state === "sent") {
      return privateJson(
        { ok: true, needsCode: true, token: proof.token, devCode: proof.devCode },
        { status: 202 }
      );
    }

    const limited = rateLimit("contact", ip);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const result = await sendContactMessage({ name, email, message });
    return privateJson({ ok: true, delivered: result.delivered, devFallback: result.devFallback });
  } catch (err) {
    logFailure("contact", err);
    return errors.server();
  }
}
