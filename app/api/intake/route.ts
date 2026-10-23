import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { currentAge } from "@/lib/validation";
import { MINOR_AGE, cleanIntake, validateIntake, type IntakeInput } from "@/lib/intake";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/intake — save your own intake form.
 *
 * There is no GET and no id in the path: you can only ever write your own, and
 * the page that shows it back to you is rendered on the server from your
 * session. Nothing here accepts a user id from the browser, because clinical
 * data with a user id in the request is one typo away from being everybody's.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const body = await readJson<Partial<IntakeInput>>(req);
    if (!body) return errors.badBody();

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { age: true, dateOfBirth: true },
    });
    const age = user ? currentAge(user) : null;
    const minor = age !== null && age < MINOR_AGE;

    const form = cleanIntake(body);
    const fields = validateIntake(form, { minor });
    if (Object.keys(fields).length) return errors.validation(fields);

    await prisma.intakeForm.upsert({
      where: { userId: session.sub },
      create: { userId: session.sub, ...form },
      update: form,
    });

    return privateJson({ ok: true });
  } catch (err) {
    logFailure("intake.save", err);
    return errors.server();
  }
}
