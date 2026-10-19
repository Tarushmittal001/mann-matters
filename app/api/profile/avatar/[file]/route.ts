import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth";
import { AVATAR_DIR, UPLOAD_PREFIX, uploadedFilename } from "@/lib/avatars";
import { prisma } from "@/lib/db";
import { errors, logFailure } from "@/lib/http";

export const dynamic = "force-dynamic";
/** Reads a file off disk; cannot run on the Edge runtime. */
export const runtime = "nodejs";

/**
 * GET /api/profile/avatar/:file — serve a client's uploaded picture.
 *
 * Uploads are kept outside /public precisely so this check happens. A face on
 * a therapy site says something about the person whose face it is, so the only
 * people who get it are:
 *
 *   - the client themselves;
 *   - a practitioner they have actually booked with;
 *   - an admin, who can already see the client list.
 *
 * Anyone else gets a 404 rather than a 403: a 403 would confirm the file
 * exists, which is itself the thing worth hiding.
 *
 * The filename is matched against a generated-name pattern before it touches
 * the filesystem, and the row is looked up *by* that path — so a request can
 * only ever name a file some account already points at.
 */

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  try {
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const name = uploadedFilename(`${UPLOAD_PREFIX}${params.file}`);
    if (!name) return errors.notFound("That picture couldn't be found.");

    const owner = await prisma.user.findFirst({
      where: { avatar: `${UPLOAD_PREFIX}${name}` },
      select: { id: true },
    });
    if (!owner) return errors.notFound("That picture couldn't be found.");

    let allowed = owner.id === session.sub || session.role === "ADMIN";

    if (!allowed && session.role === "EXPERT") {
      const profile = await prisma.expertProfile.findUnique({
        where: { userId: session.sub },
        select: { expertId: true },
      });
      allowed = !!profile
        ? (await prisma.booking.count({
            where: { userId: owner.id, expertId: profile.expertId },
          })) > 0
        : false;
    }
    if (!allowed) return errors.notFound("That picture couldn't be found.");

    const bytes = await readFile(path.join(AVATAR_DIR, name)).catch(() => null);
    if (!bytes) return errors.notFound("That picture couldn't be found.");

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPES[name.split(".").pop() as string] ?? "application/octet-stream",
        "Content-Length": String(bytes.length),
        // private: the file is personal, so it may sit in this person's own
        // browser cache and nowhere shared. The name never changes for a given
        // upload, and a replacement gets a new one, so this can be long.
        "Cache-Control": "private, max-age=86400",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    logFailure("profile.avatar.read", err);
    return errors.server();
  }
}
