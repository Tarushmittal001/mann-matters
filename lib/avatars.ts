import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * A client's own picture.
 *
 * Two kinds of value can sit in `User.avatar`, and the difference matters:
 *
 *  1. one of the watercolour portraits in /public/reviews — a public file,
 *     stored as the ordinary path `/reviews/12.png`;
 *  2. a photo they uploaded, stored as `/api/profile/avatar/<file>`.
 *
 * ── WHY UPLOADS ARE NOT IN /public ─────────────────────────────────────────
 * A face on a therapy site is a medical fact about a person. Practitioner
 * portraits live in /public because those people are publishing themselves;
 * a client is not. So uploads are written outside the web root and served by
 * a route that checks who is asking — the client themselves, a practitioner
 * they have actually booked, or an admin. A random filename under /public
 * would be unguessable, which is not the same as private: it would survive in
 * caches, proxies and anybody's browser history, and nothing would stop a
 * leaked URL being opened by whoever found it.
 *
 * Because the serving route needs the caller's cookie, an uploaded avatar must
 * be rendered with a plain <img>, never next/image — the optimiser fetches the
 * source itself, without the session, and would get a 401.
 */

/** Where uploaded avatars live: outside /public, so nothing serves them by accident. */
export const AVATAR_DIR = path.join(process.cwd(), "private", "avatars");

/** The prefix of an uploaded avatar's stored value. */
export const UPLOAD_PREFIX = "/api/profile/avatar/";

/** Generated names only: lowercase hex, one known extension. Nothing else is served. */
const FILENAME_RE = /^[0-9a-f]{16}\.(jpg|png|webp)$/;

export function isUploadedAvatar(value: string | null | undefined): boolean {
  return !!value && value.startsWith(UPLOAD_PREFIX);
}

/**
 * The filename inside an uploaded avatar's path, or null if the value is not
 * one of ours. The shape is checked rather than merely trimmed, so a stored
 * value can never be talked into reading `../../.env`.
 */
export function uploadedFilename(value: string | null | undefined): string | null {
  if (!isUploadedAvatar(value)) return null;
  const name = value!.slice(UPLOAD_PREFIX.length);
  return FILENAME_RE.test(name) ? name : null;
}

/**
 * The watercolours a client may choose instead of a photo — the same portraits
 * offered on a review, read from the folder so adding one is just saving the
 * next numbered file.
 */
export function listStockAvatars(): { src: string; label: string }[] {
  let files: string[] = [];
  try {
    files = readdirSync(path.join(process.cwd(), "public", "reviews"));
  } catch {
    return [];
  }
  return files
    .map((f) => ({ f, m: f.match(/^(\d+)\.(png|jpe?g|webp)$/i) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => !!x.m)
    .map(({ f, m }) => ({ n: Number(m[1]), src: `/reviews/${f}` }))
    .sort((a, b) => a.n - b.n)
    .map((a, i) => ({ src: a.src, label: `Portrait ${i + 1}` }));
}

/** True if `value` is one of the watercolours we actually offer. */
export function isStockAvatar(value: string): boolean {
  return listStockAvatars().some((a) => a.src === value);
}
