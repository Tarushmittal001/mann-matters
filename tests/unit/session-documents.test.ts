import { describe, expect, it } from "vitest";
import { formatAgeSex, ordinal } from "@/lib/session-documents";

describe("formatAgeSex", () => {
  it("joins both when the profile has both", () => {
    expect(formatAgeSex(24, "female")).toBe("24 yrs · Female");
  });
  it("shows whichever one exists", () => {
    expect(formatAgeSex(31, null)).toBe("31 yrs");
    expect(formatAgeSex(null, "non-binary")).toBe("Non binary");
  });
  it("is empty when the profile has neither", () => {
    expect(formatAgeSex(null, null)).toBe("");
    expect(formatAgeSex(0, "  ")).toBe("");
  });
});

describe("ordinal", () => {
  it("handles the irregular endings", () => {
    expect([1, 2, 3, 4].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th"]);
    expect([11, 12, 13].map(ordinal)).toEqual(["11th", "12th", "13th"]);
    expect([21, 22, 23, 101, 111].map(ordinal)).toEqual(["21st", "22nd", "23rd", "101st", "111th"]);
  });
});
