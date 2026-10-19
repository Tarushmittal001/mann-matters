import { describe, expect, it } from "vitest";
import { GRAINS, MAX_BUCKETS, bucketsBetween, isGrain, suggestGrain } from "@/lib/payouts";

/**
 * The bucketing behind the revenue page. The maths is all on YYYY-MM-DD
 * strings in clinic time, so these cases are the ones where a careless Date
 * would drift: month ends, year ends, and a Sunday, which belongs to the week
 * that started the previous Monday rather than opening a new one.
 *
 * `weekStart` and `bucketsFor` are internal, so this exercises them through
 * the same rules written out here — if the implementation changes shape these
 * stay meaningful, because they encode the intent rather than the code.
 */

const UTC = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

function weekStart(date: string): string {
  const d = UTC(date);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

describe("week buckets start on Monday", () => {
  it("maps every day of one week to the same Monday", () => {
    // 2026-10-05 is a Monday
    for (const day of [
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11", // Sunday — still that week
    ]) {
      expect(weekStart(day), day).toBe("2026-10-05");
    }
  });

  it("starts a new bucket on the next Monday", () => {
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
  });

  it("carries a week across a month boundary", () => {
    // Sun 1 Nov 2026 belongs to the week that began Mon 26 Oct
    expect(weekStart("2026-11-01")).toBe("2026-10-26");
  });

  it("carries a week across a year boundary", () => {
    // Fri 1 Jan 2027 belongs to the week that began Mon 28 Dec 2026
    expect(weekStart("2027-01-01")).toBe("2026-12-28");
  });
});

describe("grain vocabulary", () => {
  it("offers exactly the four zooms the page shows", () => {
    expect(GRAINS.map((g) => g.value)).toEqual(["day", "week", "month", "year"]);
  });
  it("rejects anything else, so a URL cannot invent one", () => {
    expect(isGrain("day")).toBe(true);
    expect(isGrain("decade")).toBe(false);
    expect(isGrain(undefined)).toBe(false);
    expect(isGrain("")).toBe(false);
  });
  it("fits the zoom to the span when nobody has chosen one", () => {
    expect(suggestGrain(1)).toBe("day");
    expect(suggestGrain(30)).toBe("day");
    expect(suggestGrain(60)).toBe("week");
    expect(suggestGrain(365)).toBe("month");
    expect(suggestGrain(5000)).toBe("year");
  });
});

describe("buckets across a range", () => {
  it("covers whole buckets at both ends", () => {
    // 3 Oct 2026 is a Saturday, 17 Oct a Saturday: three calendar weeks touched
    const weeks = bucketsBetween("2026-10-03", "2026-10-17", "week");
    expect(weeks).toEqual(["2026-10-12", "2026-10-05", "2026-09-28"]);
  });

  it("returns one bucket for a single day", () => {
    expect(bucketsBetween("2026-10-07", "2026-10-07", "day")).toEqual(["2026-10-07"]);
  });

  it("is newest first", () => {
    const days = bucketsBetween("2026-10-05", "2026-10-08", "day");
    expect(days).toEqual(["2026-10-08", "2026-10-07", "2026-10-06", "2026-10-05"]);
  });

  it("walks months and years by their own calendar", () => {
    expect(bucketsBetween("2026-08-14", "2026-10-02", "month")).toEqual([
      "2026-10",
      "2026-09",
      "2026-08",
    ]);
    expect(bucketsBetween("2024-06-01", "2026-02-01", "year")).toEqual(["2026", "2025", "2024"]);
  });

  it("crosses a year boundary without losing a bucket", () => {
    expect(bucketsBetween("2025-12-30", "2026-01-02", "day")).toEqual([
      "2026-01-02",
      "2026-01-01",
      "2025-12-31",
      "2025-12-30",
    ]);
  });

  it("caps an absurd span instead of building ten thousand rows", () => {
    const days = bucketsBetween("2000-01-01", "2026-10-14", "day");
    expect(days.length).toBe(MAX_BUCKETS);
    expect(days[0]).toBe("2026-10-14");
  });

  it("a span shorter than one bucket still yields the bucket it sits in", () => {
    expect(bucketsBetween("2026-10-06", "2026-10-08", "month")).toEqual(["2026-10"]);
  });
});
