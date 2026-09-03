import { getSession } from "@/lib/auth";
import { errors, logFailure, privateJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Who the caller is, if anyone. Never cached — a shared proxy must not hand
 *  one person's identity to the next visitor. */
export async function GET() {
  try {
    const session = await getSession();
    return privateJson({
      user: session
        ? { name: session.name, email: session.email, role: session.role }
        : null,
    });
  } catch (err) {
    logFailure("auth.me", err);
    return errors.server();
  }
}
