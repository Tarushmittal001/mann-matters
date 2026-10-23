import { describe, expect, it } from "vitest";
import { ageOn, currentAge, dobString, isCalendarDate, validateDateOfBirth } from "@/lib/validation";

/**
 * Date of birth replaced the typed age because it decides whether a parent or
 * guardian must agree to therapy. These pin the arithmetic that decision rests on.
 */
describe("isCalendarDate", () => {
  it("accepts real days and rejects rolled-over or malformed ones", () => {
    expect(isCalendarDate("2008-02-29")).toBe(true);
    expect(isCalendarDate("2007-02-29")).toBe(false); // not a leap year
    expect(isCalendarDate("2010-11-31")).toBe(false);
    expect(isCalendarDate("2010-13-01")).toBe(false);
    expect(isCalendarDate("10-01-2010")).toBe(false);
    expect(isCalendarDate("")).toBe(false);
  });
});

describe("ageOn", () => {
  it("counts a birthday only once it has arrived", () => {
    expect(ageOn("2008-10-20", "2026-10-19")).toBe(17);
    expect(ageOn("2008-10-19", "2026-10-19")).toBe(18);
    expect(ageOn("2008-10-18", "2026-10-19")).toBe(18);
  });

  it("handles a 29 February birthday in a non-leap year", () => {
    expect(ageOn("2008-02-29", "2026-02-28")).toBe(17);
    expect(ageOn("2008-02-29", "2026-03-01")).toBe(18);
  });
});

describe("validateDateOfBirth", () => {
  const today = "2026-10-19";

  it("requires a real date that is not in the future", () => {
    expect(validateDateOfBirth("", today)).toMatch(/date of birth/);
    expect(validateDateOfBirth("2010-02-30", today)).toMatch(/real date/);
    expect(validateDateOfBirth("2026-10-20", today)).toMatch(/future/);
  });

  it("keeps the 13-and-over rule the typed age had", () => {
    expect(validateDateOfBirth("2013-10-20", today)).toMatch(/13 or older/); // 12 today
    expect(validateDateOfBirth("2013-10-19", today)).toBeNull(); // 13 today
  });

  it("accepts an ordinary adult date", () => {
    expect(validateDateOfBirth("1998-04-12", today)).toBeNull();
  });
});

describe("currentAge", () => {
  it("prefers the date of birth, and falls back to a legacy typed age", () => {
    const dob = new Date("2000-01-01T00:00:00Z");
    expect(currentAge({ dateOfBirth: dob, age: 99 })).toBe(ageOn("2000-01-01"));
    expect(currentAge({ dateOfBirth: null, age: 24 })).toBe(24);
    expect(currentAge({ dateOfBirth: null, age: null })).toBeNull();
  });

  it("round-trips the stored date for a date input", () => {
    expect(dobString(new Date("2008-02-29T00:00:00Z"))).toBe("2008-02-29");
    expect(dobString(null)).toBe("");
  });
});
