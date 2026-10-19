import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/expert-admin";
import { clientKey, errors, isSameOrigin, logFailure, privateJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
/** Reads a file off disk and writes one; cannot run on the Edge runtime. */
export const runtime = "nodejs";

/**
 * POST /api/admin/experts/photo — take a portrait off an admin's computer and
 * put it somewhere the site can serve it.
 *
 * The file lands in `public/experts/`, so the value stored on the listing is an
 * ordinary path like `/experts/ananya-4f9c21.jpg` — exactly what the field
 * accepted when it was typed by hand. Nothing downstream changes: `next/image`
 * optimises it like any local file, and a listing whose photo was pasted in as
 * a URL keeps working.
 *
 * WHY NOT A DATA URL IN THE DATABASE: `next/image` refuses `data:` sources
 * unless every call site opts out of optimisation, and the public cards don't.
 * A 2 MB portrait would also be re-sent inside every page that lists it.
 *
 * WHAT IS CHECKED, and why each one matters for a route that writes files:
 *  - admin session, same origin — as with every other route under /api/admin;
 *  - a rate limit, so a stuck loop cannot quietly fill the disk;
 *  - 8 MB ceiling, read before the body is touched;
 *  - the bytes must *start* like a real JPEG, PNG or WebP. The declared type
 *    and the filename are both the client's word for it, and a file called
 *    portrait.jpg that is really a script is the oldest upload trick there is;
 *  - the name written to disk is generated here from the therapist's name plus
 *    random hex. Nothing from the uploaded filename reaches the filesystem, so
 *    there is no path to traverse out of and no existing file to overwrite.
 */

const SIGNATURES: { ext: string; type: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    type: "image/png",
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "webp",
    type: "image/webp",
    test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const limited = await rateLimit("adminUpload", `admin:${session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    // trust the declared length only to reject early; the real check is the
    // size of what we actually read
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES + 4096) {
      return errors.validation({ photo: "That image is over 8 MB. Please use a smaller one." });
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File) || file.size === 0) {
      return errors.validation({ photo: "No image came through. Please choose a file." });
    }
    if (file.size > MAX_BYTES) {
      return errors.validation({ photo: "That image is over 8 MB. Please use a smaller one." });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = SIGNATURES.find((s) => s.test(bytes));
    if (!kind) {
      return errors.validation({
        photo: "That file isn't a JPEG, PNG or WebP image.",
      });
    }

    // the stored name is ours, start to finish: a slug of the therapist's name
    // for something human to read in the folder, and random hex so two
    // uploads for the same person never collide
    const who = slugify(String(form.get("name") ?? "")).slice(0, 32) || "therapist";
    const filename = `${who}-${randomBytes(4).toString("hex")}.${kind.ext}`;

    const dir = path.join(process.cwd(), "public", "experts");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    return privateJson({ path: `/experts/${filename}`, type: kind.type, bytes: bytes.length });
  } catch (err) {
    logFailure("admin.experts.photo", err);
    return errors.server();
  }
}
