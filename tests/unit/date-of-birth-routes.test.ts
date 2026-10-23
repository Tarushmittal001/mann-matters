import { beforeEach, describe, expect, it, vi } from "vitest";
// vi.mock calls below are hoisted above these imports, so the routes see the mocks
import { POST as book } from "@/app/api/bookings/route";
import { PATCH as updateProfile } from "@/app/api/profile/route";
import { istDateOffset } from "@/lib/features/booking/policy";

/**
 * Date of birth at the two places it is enforced.
 *
 *   - Booking refuses an account with no date of birth, and decides "is this
 *     a minor who needs a guardian?" from the date, not a typed age.
 *   - The profile lets a date of birth be corrected until the first booking,
 *     then fixes it — so nobody can turn 18 on paper to skip guardian consent.
 *
 * The database, session, rate limits and catalogue are mocked: these are about
 * the decisions the route handlers make.
 */

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  booking: { count: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({
  getSession: async () => ({ sub: "u1", name: "Test Person", email: "t@example.invalid", role: "USER" }),
  createSession: async () => {},
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => ({ ok: true }) }));
vi.mock("@/lib/features/booking/server", () => ({
  expertById: async () => ({ id: "e1", name: "Test Expert" }),
  createBookingWithRef: vi.fn(),
  createProBonoBooking: vi.fn(),
  isUniqueViolation: () => false,
  offersSlot: async () => true,
  proBonoStatus: vi.fn(),
  releaseExpiredHolds: async () => {},
  serializeBooking: (b: unknown) => b,
  takenSlots: async () => [],
}));
vi.mock("@/lib/service-catalogue", () => ({
  serviceBySlug: () => ({ slug: "individual", title: "Individual therapy" }),
  concernForService: () => "anxiety",
  expertOffersService: async () => true,
  priceForBooking: async () => 999,
}));
vi.mock("@/lib/coupons", () => ({ resolveCode: vi.fn() }));

const request = (method: string, path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method,
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const yearsAgo = (n: number) => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - n);
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00Z`);
};

beforeEach(() => vi.clearAllMocks());

describe("booking", () => {
  const slot = { service: "individual", expertId: "e1", date: istDateOffset(3), time: "10:00" };
  const noGuardian = { guardianName: "", guardianPhone: "", guardianConsent: false };

  it("refuses an account with no date of birth, before touching the calendar", async () => {
    db.user.findUnique.mockResolvedValue({ dateOfBirth: null, intake: null });

    const res = await book(request("POST", "/api/bookings", slot));

    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("DOB_REQUIRED");
  });

  it("asks a 15-year-old for a guardian, working from the date of birth", async () => {
    db.user.findUnique.mockResolvedValue({ dateOfBirth: yearsAgo(15), intake: noGuardian });

    const res = await book(request("POST", "/api/bookings", slot));

    expect(res.status).toBe(422);
    const { fields } = await res.json();
    expect(fields).toHaveProperty("guardianName");
    expect(fields).toHaveProperty("guardianConsent");
  });
});

describe("profile date of birth", () => {
  const profile = {
    name: "Test Person",
    gender: "female",
    city: "Pune",
    state: "Maharashtra",
    organisation: "",
    phone: "9876543210",
    language: "",
    notes: "",
  };
  const saved = (dob: Date | null) => ({
    id: "u1",
    name: "Test Person",
    dateOfBirth: dob,
    gender: "female",
    city: "Pune",
    state: "Maharashtra",
    avatar: null,
    organisation: null,
    email: "t@example.invalid",
    phone: "+919876543210",
    phoneVerified: new Date(),
    language: null,
    notes: null,
    role: "USER",
    emailVerified: new Date(),
    createdAt: new Date(),
  });

  beforeEach(() => {
    db.user.update.mockImplementation(async ({ data }: { data: { dateOfBirth: Date } }) => saved(data.dateOfBirth));
  });

  it("cannot be changed once they have booked", async () => {
    db.user.findUnique.mockResolvedValue({ phone: "+919876543210", dateOfBirth: yearsAgo(16) });
    db.booking.count.mockResolvedValue(1);

    const res = await updateProfile(
      request("PATCH", "/api/profile", { ...profile, dateOfBirth: dobOf(yearsAgo(19)) })
    );

    expect(res.status).toBe(422);
    expect((await res.json()).fields.dateOfBirth).toMatch(/after you've booked/);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("can be corrected before the first booking", async () => {
    db.user.findUnique.mockResolvedValue({ phone: "+919876543210", dateOfBirth: yearsAgo(16) });
    db.booking.count.mockResolvedValue(0);

    const res = await updateProfile(
      request("PATCH", "/api/profile", { ...profile, dateOfBirth: dobOf(yearsAgo(19)) })
    );

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledOnce();
  });

  it("can be added to an older account that has booked but never gave one", async () => {
    db.user.findUnique.mockResolvedValue({ phone: "+919876543210", dateOfBirth: null });
    db.booking.count.mockResolvedValue(3);

    const res = await updateProfile(
      request("PATCH", "/api/profile", { ...profile, dateOfBirth: dobOf(yearsAgo(30)) })
    );

    expect(res.status).toBe(200);
  });

  it("does not block other edits when it is unchanged", async () => {
    const dob = yearsAgo(16);
    db.user.findUnique.mockResolvedValue({ phone: "+919876543210", dateOfBirth: dob });
    db.booking.count.mockResolvedValue(2);

    const res = await updateProfile(
      request("PATCH", "/api/profile", { ...profile, city: "Mumbai", dateOfBirth: dobOf(dob) })
    );

    expect(res.status).toBe(200);
  });
});

function dobOf(d: Date) {
  return d.toISOString().slice(0, 10);
}
