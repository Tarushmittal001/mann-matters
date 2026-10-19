import { describe, expect, it } from "vitest";
import { PRESETS, isPreset, rangeParams, resolveRange } from "@/lib/admin-period";

/**
 * The admin time filter. A fixed "now" throughout: 14 Oct 2026, 09:00 IST,
 * which is 03:30 UTC — deliberately a time of day where a server reading UTC
 * and a clinic reading IST agree, and 23:00 IST cases are checked separately
 * because that is where they stop agreeing.
 */
const NOW = new Date("2026-10-14T03:30:00Z"); // 09:00 IST
const at = (p: Parameters<typeof resolveRange>[0]) => resolveRange(p, NOW);

describe("presets", () => {
  it("defaults to the last 30 days when nothing is asked for", () => {
    const r = at({});
    expect(r.preset).toBe("month");
    expect(r.to).toBe("2026-10-14");
    expect(r.from).toBe("2026-09-15"); // 29 days back, inclusive of today = 30
    expect(r.days).toBe(30);
  });

  it("today is a single day, not an empty range", () => {
    const r = at({ period: "today" });
    expect(r.from).toBe("2026-10-14");
    expect(r.to).toBe("2026-10-14");
    expect(r.days).toBe(1);
  });

  it("last 7 days covers a week including today", () => {
    const r = at({ period: "week" });
    expect(r.from).toBe("2026-10-08");
    expect(r.days).toBe(7);
  });

  it("all time has no floor", () => {
    const r = at({ period: "all" });
    expect(r.from).toBeNull();
    expect(r.fromAt).toBeNull();
  });

  it("falls back rather than breaking on a made-up preset", () => {
    expect(at({ period: "fortnight" }).preset).toBe("month");
    expect(isPreset("fortnight")).toBe(false);
    expect(isPreset("all")).toBe(true);
  });

  it("every preset in the list resolves", () => {
    for (const p of PRESETS) expect(at({ period: p.value }).preset, p.value).toBe(p.value);
  });
});

describe("a custom range", () => {
  it("takes both ends as given", () => {
    const r = at({ from: "2026-10-01", to: "2026-10-07" });
    expect(r.preset).toBe("custom");
    expect(r.from).toBe("2026-10-01");
    expect(r.to).toBe("2026-10-07");
    expect(r.days).toBe(7);
  });

  it("beats a preset when both are in the URL", () => {
    const r = at({ period: "today", from: "2026-10-01", to: "2026-10-07" });
    expect(r.preset).toBe("custom");
    expect(r.from).toBe("2026-10-01");
  });

  it("swaps the ends when they are the wrong way round", () => {
    const r = at({ from: "2026-10-07", to: "2026-10-01" });
    expect(r.from).toBe("2026-10-01");
    expect(r.to).toBe("2026-10-07");
  });

  it("one end alone still gives a range", () => {
    expect(at({ from: "2026-10-01" }).to).toBe("2026-10-14");
    expect(at({ to: "2026-10-07" }).from).toBe("2020-01-01");
  });

  it("never reaches into the future", () => {
    expect(at({ from: "2026-10-01", to: "2099-01-01" }).to).toBe("2026-10-14");
    // a range entirely in the future collapses onto today rather than inverting
    const r = at({ from: "2099-01-01", to: "2099-02-01" });
    expect(r.from).toBe("2026-10-14");
    expect(r.to).toBe("2026-10-14");
  });

  it("clamps an absurd past rather than scanning from the year dot", () => {
    expect(at({ from: "1823-04-01", to: "2026-10-07" }).from).toBe("2020-01-01");
  });

  it("ignores junk and falls back to the preset", () => {
    for (const bad of ["", "yesterday", "2026-13-45", "14/10/2026", "2026-10"]) {
      expect(at({ from: bad }).preset, bad).toBe("month");
    }
  });

  it("a single day is a valid range", () => {
    const r = at({ from: "2026-10-07", to: "2026-10-07" });
    expect(r.days).toBe(1);
    expect(r.label).toMatch(/7 Oct 2026/);
  });
});

describe("the instants either side", () => {
  it("starts at IST midnight, not the server's", () => {
    const r = at({ from: "2026-10-01", to: "2026-10-07" });
    // 1 Oct 00:00 IST is 30 Sept 18:30 UTC
    expect(r.fromAt?.toISOString()).toBe("2026-09-30T18:30:00.000Z");
  });

  it("ends at the first instant after the last day, so that day is included", () => {
    const r = at({ from: "2026-10-01", to: "2026-10-07" });
    // 8 Oct 00:00 IST is 7 Oct 18:30 UTC — an 11pm IST signup on the 7th is in
    expect(r.toAt.toISOString()).toBe("2026-10-07T18:30:00.000Z");
    const lateSignup = new Date("2026-10-07T17:45:00Z"); // 23:15 IST on the 7th
    expect(lateSignup < r.toAt).toBe(true);
    expect(lateSignup >= (r.fromAt as Date)).toBe(true);
  });

  it("works across a month boundary", () => {
    const r = at({ from: "2026-09-30", to: "2026-09-30" });
    expect(r.toAt.toISOString()).toBe("2026-09-30T18:30:00.000Z");
  });
});

describe("labels and link-carrying", () => {
  it("names a preset the way the chip does", () => {
    expect(at({ period: "week" }).label).toBe("Last 7 days");
  });
  it("collapses a shared year", () => {
    expect(at({ from: "2026-10-01", to: "2026-10-14" }).label).toBe("1 Oct – 14 Oct 2026");
  });
  it("spells both years out when they differ", () => {
    expect(at({ from: "2025-12-28", to: "2026-01-04" }).label).toBe("28 Dec 2025 – 4 Jan 2026");
  });
  it("a preset reads lowercase mid-sentence", () => {
    expect(at({ period: "month" }).inline).toBe("last 30 days");
  });
  it("a date range keeps its capitals mid-sentence — '1 oct' is not a date", () => {
    const r = at({ from: "2026-10-01", to: "2026-10-14" });
    expect(r.inline).toBe("1 Oct – 14 Oct 2026");
    expect(r.inline).toBe(r.label);
  });
  it("carries a preset through a link as a preset", () => {
    expect(rangeParams(at({ period: "year" }))).toEqual({ period: "year" });
  });
  it("carries a custom range through a link as dates", () => {
    expect(rangeParams(at({ from: "2026-10-01", to: "2026-10-07" }))).toEqual({
      from: "2026-10-01",
      to: "2026-10-07",
    });
  });
});
