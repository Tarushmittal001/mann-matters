// server only: reads the filesystem
import { readdirSync } from "node:fs";
import path from "node:path";
import { COUPLE_AVATARS, type FeedbackAvatar } from "@/lib/feedback";

/**
 * Every numbered portrait in /public/reviews (1.png, 2.png, … 31.png), read
 * from the folder, so adding an avatar is just saving the next number there.
 * Single portraits first, couples after, each in number order.
 */
export function listFeedbackAvatars(): FeedbackAvatar[] {
  let files: string[] = [];
  try {
    files = readdirSync(path.join(process.cwd(), "public", "reviews"));
  } catch {
    return [];
  }
  const numbered = files
    .map((f) => ({ f, m: f.match(/^(\d+)\.(png|jpe?g|webp)$/i) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => !!x.m)
    .map(({ f, m }) => ({ n: Number(m[1]), src: `/reviews/${f}` }))
    .sort((a, b) => a.n - b.n);

  const singles = numbered.filter((a) => !COUPLE_AVATARS.has(a.n));
  const couples = numbered.filter((a) => COUPLE_AVATARS.has(a.n));
  return [
    ...singles.map((a, i) => ({ src: a.src, label: `Portrait ${i + 1}` })),
    ...couples.map((a, i) => ({ src: a.src, label: `Couple portrait ${i + 1}` })),
  ];
}
