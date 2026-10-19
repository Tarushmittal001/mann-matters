import { describe, expect, it } from "vitest";
import { CITY_MAX, STATE_OPTIONS, validateCity, validateState } from "@/lib/validation";

/**
 * Where a client is. The city field is the interesting one: it has to accept
 * every real Indian town name without becoming a free-text dumping ground for
 * whole postal addresses.
 */

describe("validateState", () => {
  it("accepts every state and union territory offered", () => {
    for (const s of STATE_OPTIONS) expect(validateState(s)).toBeNull();
  });
  it("covers all 28 states and 8 union territories", () => {
    expect(STATE_OPTIONS).toHaveLength(36);
    expect(new Set(STATE_OPTIONS).size).toBe(36);
  });
  it("is required", () => {
    expect(validateState("")).toMatch(/choose your state/i);
    expect(validateState("   ")).toMatch(/choose your state/i);
  });
  it("refuses anything off the list, including a near miss", () => {
    expect(validateState("NCR")).not.toBeNull();
    expect(validateState("Orissa")).not.toBeNull(); // renamed Odisha in 2011
    expect(validateState("delhi")).not.toBeNull(); // the exact spelling is the point
  });
});

describe("validateCity", () => {
  it("accepts real names, in any script and with the punctuation they carry", () => {
    for (const city of [
      "Jaipur",
      "Thiruvananthapuram",
      "St. Thomas Mount",
      "Kozhikode (Calicut)",
      "Navi Mumbai",
      "Puducherry",
      "जयपुर",
      "D'Souza Nagar",
      "Shillong-Jowai",
    ]) {
      expect(validateCity(city), city).toBeNull();
    }
  });

  it("is required", () => {
    expect(validateCity("")).toMatch(/city or town/i);
    expect(validateCity("  ")).toMatch(/city or town/i);
  });

  it("refuses a single character", () => {
    expect(validateCity("J")).not.toBeNull();
  });

  it("refuses a pasted street address, because we hold no addresses", () => {
    expect(validateCity("12 MG Road, Bengaluru")).toMatch(/house or street number/i);
    expect(validateCity("Flat 4B")).toMatch(/house or street number/i);
  });

  it("refuses markup and anything that looks like an injected payload", () => {
    expect(validateCity("<script>")).not.toBeNull();
    expect(validateCity("a@b.com")).not.toBeNull();
    expect(validateCity("Pune?")).not.toBeNull();
  });

  it("caps the length", () => {
    expect(validateCity("x".repeat(CITY_MAX))).toBeNull();
    expect(validateCity("x".repeat(CITY_MAX + 1))).toMatch(/under/i);
  });

  it("ignores surrounding whitespace rather than failing on it", () => {
    expect(validateCity("  Kolkata  ")).toBeNull();
  });
});
