import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { FEEDBACK_STATUS, validateFeedback } from "@/lib/feedback";
import { listFeedbackAvatars } from "@/lib/feedback-avatars";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * /api/feedback — a signed-in client's own feedback for "We heard you".
 *
 * One per account. Saving (new or edited) always puts it back to PENDING, so
 * nothing reaches the home page without an admin reading it first.
 */

const SELECT = { quote: true, avatar: true, nameStyle: true, detail: true, status: true, updatedAt: true } as const;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    const feedback = await prisma.feedback.findUnique({ where: { userId: session.sub }, select: SELECT });
    return privateJson({ feedback });
  } catch (err) {
    logFailure("feedback.get", err);
    return errors.server();
  }
}

type Body = { quote?: string; avatar?: string; nameStyle?: string; detail?: string };

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const limited = rateLimit("feedback", `${session.sub}:${clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const input = {
      quote: (body.quote ?? "").trim(),
      avatar: body.avatar ?? "",
      nameStyle: body.nameStyle ?? "",
      detail: (body.detail ?? "").trim(),
    };
    const fields = validateFeedback(input, listFeedbackAvatars());
    if (Object.keys(fields).length) return errors.validation(fields);

    const data = {
      quote: input.quote,
      avatar: input.avatar,
      nameStyle: input.nameStyle,
      detail: input.detail || null,
      status: FEEDBACK_STATUS.pending,
      reviewedAt: null,
    };
    const feedback = await prisma.feedback.upsert({
      where: { userId: session.sub },
      create: { userId: session.sub, ...data },
      update: data,
      select: SELECT,
    });
    return privateJson({ ok: true, feedback });
  } catch (err) {
    logFailure("feedback.save", err);
    return errors.server();
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    await prisma.feedback.deleteMany({ where: { userId: session.sub } });
    return privateJson({ ok: true });
  } catch (err) {
    logFailure("feedback.delete", err);
    return errors.server();
  }
}
