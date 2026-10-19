import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth";
import { AVATAR_DIR, UPLOAD_PREFIX, isStockAvatar, uploadedFilename } from "@/lib/avatars";
import { prisma } from "@/lib/db";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
/** Writes files; cannot run on the Edge runtime. */
export const runtime = "nodejs";

/**
 * A client's own picture, set two ways.
 *
 *   PATCH — choose one of the watercolours we offer, or clear it entirely.
 *   POST  — upload a photo of your own.
 *
 * Only ever the caller's own avatar: the row is addressed by `session.sub`, so
 * there is no id in the request to tamper with and nothing to own-check.
 *
 * Replacing or clearing an uploaded photo deletes the old file. Keeping a copy
 * of a face somebody has just removed would be the opposite of what they asked
 * for, and this is the one chance to honour it — once the row stops pointing at
 * the file, nothing knows it exists.
 */

const SIGNATURES: { ext: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    test: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "webp",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

const MAX_BYTES = 5 * 1024 * 1024;

/** Forget the file the old value pointed at. Never fails the request. */
async function forget(previous: string | null) {
  const name = uploadedFilename(previous);
  if (!name) return;
  await unlink(path.join(AVATAR_DIR, name)).catch(() => {});
}

export async function PATCH(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const body = await readJson<{ avatar?: string | null }>(req);
    if (!body) return errors.badBody();

    const wanted = (body.avatar ?? "").trim();
    // Only a watercolour we actually offer, or nothing. An uploaded path can't
    // be set this way: that would let anyone point their row at somebody
    // else's file by guessing a name.
    if (wanted && !isStockAvatar(wanted)) {
      return errors.validation({ avatar: "Please choose one of the pictures shown." });
    }

    const current = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { avatar: true },
    });
    if (!current) return errors.notFound("We couldn't find your account.");

    await prisma.user.update({
      where: { id: session.sub },
      data: { avatar: wanted || null },
    });
    await forget(current.avatar);

    return privateJson({ avatar: wanted || null });
  } catch (err) {
    logFailure("profile.avatar.set", err);
    return errors.server();
  }
}

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const limited = await rateLimit("avatar", `user:${session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const tooBig = { avatar: "That image is over 5 MB. Please use a smaller one." };
    // the declared length rejects early; what we actually read is the real check
    if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES + 4096) {
      return errors.validation(tooBig);
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File) || file.size === 0) {
      return errors.validation({ avatar: "No image came through. Please choose a file." });
    }
    if (file.size > MAX_BYTES) return errors.validation(tooBig);

    const bytes = Buffer.from(await file.arrayBuffer());
    // The declared type and the filename are both the caller's word for it. A
    // file called me.jpg that is really a script is the oldest upload trick
    // there is, so the bytes have to start like a real image.
    const kind = SIGNATURES.find((s) => s.test(bytes));
    if (!kind) return errors.validation({ avatar: "That file isn't a JPEG, PNG or WebP image." });

    const current = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { avatar: true },
    });
    if (!current) return errors.notFound("We couldn't find your account.");

    /* The name is generated here and nothing from the uploaded filename
       reaches the disk, so there is no path to traverse out of and no existing
       file to overwrite. It carries no hint of whose face it is. */
    const filename = `${randomBytes(8).toString("hex")}.${kind.ext}`;
    await mkdir(AVATAR_DIR, { recursive: true });
    await writeFile(path.join(AVATAR_DIR, filename), bytes);

    const avatar = `${UPLOAD_PREFIX}${filename}`;
    await prisma.user.update({ where: { id: session.sub }, data: { avatar } });
    await forget(current.avatar);

    return privateJson({ avatar });
  } catch (err) {
    logFailure("profile.avatar.upload", err);
    return errors.server();
  }
}
