import { clearSession } from "@/lib/auth";
import { errors, isSameOrigin, privateJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return errors.crossOrigin();
  clearSession();
  return privateJson({ ok: true });
}
