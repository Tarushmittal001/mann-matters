import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { applyChange, type DesignChange, type Result } from "@/lib/dev/apply-design-change";

/**
 * Where Size Lab sends what you changed in the browser.
 *
 * Two modes, both of which append to `design-changes.jsonl` at the repo root
 * so every save is auditable:
 *
 *   apply: false   record only — the list is read and applied by hand
 *   apply: true    write it into the source now (`lib/dev/apply-design-change`)
 *
 * Applying is an exact string replacement in one file, and only ever when
 * exactly one place in the codebase can be the source of that element. Two
 * candidates is a refusal, not a coin toss. Everything shows in `git diff`.
 *
 * ── DEVELOPMENT ONLY ───────────────────────────────────────────────────────
 * This writes a file to disk from an unauthenticated request, so in any
 * environment but development it does not exist: 404, the same answer an
 * unknown path gets, with no hint that there is a route here at all. That
 * check is the first thing in the handler, before the body is read.
 *
 * `components/dev/SizeLab.tsx` is likewise null outside development, but a UI
 * that does not render is not a guard — this is.
 */

const DEV = process.env.NODE_ENV === "development";
const NOT_FOUND = () => new NextResponse("Not found", { status: 404 });

/** One save: a few resized elements and the width they were judged at. */
type Payload = {
  viewport?: unknown;
  changes?: unknown;
  /** true writes the changes into the source; false only records them */
  apply?: unknown;
};

const MAX_CHANGES = 200;

export async function POST(req: Request) {
  if (!DEV) return NOT_FOUND();

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.changes) || body.changes.length === 0) {
    return NextResponse.json({ error: "No changes to save." }, { status: 400 });
  }
  if (body.changes.length > MAX_CHANGES) {
    return NextResponse.json({ error: `At most ${MAX_CHANGES} at a time.` }, { status: 400 });
  }

  /* Applying is opt-in from the UI, and impossible anywhere but development
     — the guard at the top of this handler already saw to that. */
  const apply = body.apply === true;
  // the width the change was judged at decides which breakpoint's class to edit
  const vw = typeof body.viewport === "number" ? body.viewport : 1440;
  const results: { change: number; results: Result[] }[] = [];
  if (apply) {
    for (let i = 0; i < body.changes.length; i++) {
      results.push({
        change: i,
        results: await applyChange(body.changes[i] as DesignChange, vw),
      });
    }
  }

  const entry = {
    savedAt: new Date().toISOString(),
    viewport: typeof body.viewport === "number" ? body.viewport : null,
    applied: apply,
    changes: body.changes,
    results: apply ? results : undefined,
  };

  const dir = process.cwd();
  const file = "design-changes.jsonl";
  try {
    await mkdir(dir, { recursive: true });
    await appendFile(join(dir, file), JSON.stringify(entry) + "\n", "utf8");
  } catch {
    return NextResponse.json({ error: "Could not write the file." }, { status: 500 });
  }

  const flat = results.reduce<Result[]>((a, r) => a.concat(r.results), []);
  return NextResponse.json({
    ok: true,
    file,
    count: body.changes.length,
    applied: apply,
    written: flat.filter((r) => r.ok).length,
    skipped: flat.filter((r) => !r.ok).length,
    results: flat,
  });
}

export async function GET() {
  return NOT_FOUND();
}
