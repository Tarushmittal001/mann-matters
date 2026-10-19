import { describe, expect, it } from "vitest";
import {
  MAX_DATES,
  TIMES_PER_DATE,
  checkOffer,
  offerExpiry,
  parseOptions,
  wasOffered,
} from "@/lib/reschedule-offers";
import { todayIST } from "@/lib/features/booking/policy";

/**
 * The practitioner's offer of other times. The rules here are also the rules
 * the client's pick is checked against, so a gap in one is a gap in both.
 */
const ahead = (n: number) =>
  new Date(Date.now() + 5.5 * 3600e3 + n * 864e5).toISOString().slice(0, 10);

const good = [
  { date: ahead(3), times: ["10:00", "14:00"] },
  { date: ahead(4), times: ["09:00", "18:00"] },
  { date: ahead(5), times: ["11:00", "20:00"] },
];

describe("checkOffer", () => {
  it("accepts three dates with two times each", () => {
    const r = checkOffer(good, ahead(1), "08:00");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.options).toHaveLength(3);
  });

  it("accepts a single date with a single time", () => {
    expect(checkOffer([{ date: ahead(2), times: ["10:00"] }], ahead(1), "08:00").ok).toBe(true);
  });

  it("refuses an empty offer", () => {
    expect(checkOffer([], ahead(1), "08:00").ok).toBe(false);
    expect(checkOffer(null, ahead(1), "08:00").ok).toBe(false);
  });

  it(`refuses more than ${MAX_DATES} dates`, () => {
    const four = [...good, { date: ahead(6), times: ["10:00"] }];
    expect(checkOffer(four, ahead(1), "08:00").ok).toBe(false);
  });

  it(`refuses more than ${TIMES_PER_DATE} times on a date`, () => {
    const r = checkOffer([{ date: ahead(2), times: ["09:00", "10:00", "11:00"] }], ahead(1), "08:00");
    expect(r.ok).toBe(false);
  });

  it("refuses the past and today", () => {
    expect(checkOffer([{ date: todayIST(), times: ["10:00"] }], ahead(1), "08:00").ok).toBe(false);
    expect(checkOffer([{ date: ahead(-2), times: ["10:00"] }], ahead(1), "08:00").ok).toBe(false);
  });

  it("refuses a time that is not on the bookable grid", () => {
    // 15:00 is not a slot; 15:30 is
    expect(checkOffer([{ date: ahead(2), times: ["15:00"] }], ahead(1), "08:00").ok).toBe(false);
    expect(checkOffer([{ date: ahead(2), times: ["15:30"] }], ahead(1), "08:00").ok).toBe(true);
  });

  it("refuses the same date twice", () => {
    const dup = [
      { date: ahead(2), times: ["10:00"] },
      { date: ahead(2), times: ["14:00"] },
    ];
    expect(checkOffer(dup, ahead(1), "08:00").ok).toBe(false);
  });

  it("refuses the same time twice on one date", () => {
    expect(checkOffer([{ date: ahead(2), times: ["10:00", "10:00"] }], ahead(1), "08:00").ok).toBe(false);
  });

  it("refuses offering the slot it is already at", () => {
    const r = checkOffer([{ date: ahead(3), times: ["10:00", "14:00"] }], ahead(3), "10:00");
    expect(r.ok).toBe(false);
  });

  it("sorts dates and times, so the client reads them in order", () => {
    const jumbled = [
      { date: ahead(5), times: ["20:00", "11:00"] },
      { date: ahead(3), times: ["14:00", "10:00"] },
    ];
    const r = checkOffer(jumbled, ahead(1), "08:00");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.options[0].date).toBe(ahead(3));
      expect(r.options[0].times).toEqual(["10:00", "14:00"]);
    }
  });
});

describe("reading an offer back", () => {
  it("round-trips", () => {
    expect(parseOptions(JSON.stringify(good))).toEqual(good);
  });
  it("survives a corrupt row rather than throwing", () => {
    for (const bad of ["", "not json", "{}", "[1,2,3]", "null"]) {
      expect(parseOptions(bad), bad).toEqual([]);
    }
  });
  it("knows what was offered and what was not", () => {
    expect(wasOffered(good, ahead(3), "10:00")).toBe(true);
    expect(wasOffered(good, ahead(3), "09:00")).toBe(false);
    expect(wasOffered(good, ahead(9), "10:00")).toBe(false);
  });
});

describe("when an offer lapses", () => {
  it("never outlives the earliest slot it offers", () => {
    const soon = [{ date: ahead(1), times: ["10:00"] }];
    const expiry = offerExpiry(soon);
    expect(expiry.toISOString().slice(0, 10) <= ahead(1)).toBe(true);
  });
  it("otherwise gives the client the full window", () => {
    const later = [{ date: ahead(20), times: ["10:00"] }];
    const hours = (offerExpiry(later).getTime() - Date.now()) / 3_600_000;
    expect(Math.round(hours)).toBe(48);
  });
});
