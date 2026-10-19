import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";

/**
 * Guards on claims that appear in many places at once.
 *
 * Each of these started as a real inconsistency found by hand: three different
 * language counts, two price floors, and three different words for the same
 * practitioner. Copy spread across forty files drifts silently, and nobody
 * notices until a reader does — so the agreement is asserted here instead.
 */

const ROOTS = ["app", "components", "lib"];

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
    }
  };
  for (const r of ROOTS) walk(r);
  return out;
}

/** Source with block and line comments stripped, so notes to developers
 *  discussing a word are not mistaken for copy that uses it. */
function copyOf(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
}

describe("the practitioner is described one way", () => {
  /* Every descriptor except the chosen one, derived so this cannot go stale
     when site.practitionerWord changes. */
  const OTHERS = ["licensed", "verified", "certified", "qualified", "registered"]
    .filter((w) => w !== site.practitionerWord)
    .map((w) => `${w} psychologist`);

  it.each(OTHERS)("no page says %s", (phrase) => {
    const offenders = sourceFiles().filter((f) => copyOf(f).toLowerCase().includes(phrase));
    expect(offenders).toEqual([]);
  });

  /*
   * A council register may be shown on the profile of the person who is on
   * one. What must never appear is the claim that the practitioners AS A
   * GROUP are registered — Emoraa does not require it, so "our RCI-registered
   * psychologists" would be false. The difference is the plural.
   */
  const GROUP_NOUNS = ["psychologists", "therapists", "practitioners", "experts", "counsellors"];

  it.each(GROUP_NOUNS)("no copy claims the %s as a group are council-registered", (noun) => {
    const offenders = sourceFiles().filter((f) =>
      new RegExp(`(RCI|council)[- ]?(registered|certified|licensed)?[^.]{0,40}${noun}`, "i").test(
        copyOf(f)
      )
    );
    expect(offenders).toEqual([]);
  });

  it("site.practitionerWord is the word actually in use", () => {
    const used = sourceFiles().filter((f) =>
      copyOf(f).includes(`${site.practitionerWord} psychologist`)
    );
    expect(used.length).toBeGreaterThan(0);
  });
});

describe("no page promises a language nobody speaks", () => {
  // Telugu and Bengali were promised "through 2026" while no practitioner
  // spoke either. Add a language here only once somebody can hold a session in it.
  const UNSTAFFED = ["Telugu", "Bengali", "Punjabi", "Odia", "Assamese"];

  /*
   * Option lists are not promises. A practitioner picking the languages they
   * work in, and a client asking for one, both need the full list of Indian
   * languages on offer in a dropdown — that is a question, not a claim. Only
   * prose is checked.
   */
  const OPTION_LISTS = ["languages.ts", "expert-portal.ts", "expert-vocab.ts", "validation.ts"];

  it.each(UNSTAFFED)("%s is not promised in prose", (lang) => {
    const offenders = sourceFiles()
      .filter((f) => !OPTION_LISTS.some((o) => f.endsWith(o)))
      .filter((f) => {
        const text = copyOf(f);
        // only a sentence offering it counts, not a bare list entry
        return new RegExp(`(adding|coming|on the way|offer\w*|available in|through 20\d\d)[^.]{0,80}${lang}`, "i").test(text);
      });
    expect(offenders).toEqual([]);
  });
});
