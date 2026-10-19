import { beforeEach, describe, expect, it, vi } from "vitest";
// vi.mock calls below are hoisted above these imports, so the routes see the mocks
import { POST as phoneVerify } from "@/app/api/auth/phone/verify/route";
import { POST as reset } from "@/app/api/auth/reset/route";

/**
 * Account pre-hijack through a planted phone.
 *
 * Signup proves the phone by SMS but the email only later, by its link. So a
 * stranger can open an account in someone else's email with their own phone.
 * When the real owner later "recovers" it with a password reset, the stranger
 * must not be able to keep signing in by phone OTP.
 *
 * Two rules close it, and each is asserted here:
 *   1. phone sign-in gives no session while the email is unconfirmed;
 *   2. a reset that is the first proof of the inbox drops the unproven phone.
 *
 * The database, sessions, rate limits and OTP store are mocked: these tests are
 * about the decisions the two route handlers make, not about Postgres.
 */

const db = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), update: vi.fn() },
  phoneOtp: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
const createSession = vi.hoisted(() => vi.fn());
const resetTokenOwner = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ createSession, hashPassword: async () => "new-hash" }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: async () => ({ ok: true }),
  resetLimit: async () => {},
}));
vi.mock("@/lib/phone-otp", () => ({ consumePhoneOtp: async () => true }));
vi.mock("@/lib/password-reset", () => ({ resetTokenOwner, clearResetTokens: async () => {} }));

const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const account = (over: Record<string, unknown> = {}) => ({
  id: "u1",
  name: "Test Person",
  email: "owner@example.invalid",
  role: "USER",
  phone: "+919876543210",
  phoneVerified: new Date("2026-10-01"),
  emailVerified: null as Date | null,
  blockedAt: null,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.user.update.mockImplementation(async (args: unknown) => args);
  db.phoneOtp.deleteMany.mockImplementation(async (args: unknown) => args);
  db.$transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
});

describe("phone sign-in", () => {
  it("gives no session while the account's email is unconfirmed", async () => {
    db.user.findFirst.mockResolvedValue(account({ emailVerified: null }));

    const res = await phoneVerify(post("/api/auth/phone/verify", { phone: "9876543210", code: "123456" }));

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("UNVERIFIED");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("signs in once the email is confirmed (control)", async () => {
    db.user.findFirst.mockResolvedValue(account({ emailVerified: new Date("2026-10-02") }));

    const res = await phoneVerify(post("/api/auth/phone/verify", { phone: "9876543210", code: "123456" }));

    expect(res.status).toBe(200);
    expect(createSession).toHaveBeenCalledOnce();
  });
});

describe("password reset", () => {
  const resetBody = { token: "t", password: "a-long-new-password-1" };

  it("drops a phone nobody proved alongside the email when the reset is the first proof of the inbox", async () => {
    resetTokenOwner.mockResolvedValue(account({ emailVerified: null }));

    const res = await reset(post("/api/auth/reset", resetBody));

    expect(res.status).toBe(200);
    const { data } = db.user.update.mock.calls[0][0];
    expect(data.phone).toBeNull();
    expect(data.phoneVerified).toBeNull();
    expect(data.emailVerified).toBeInstanceOf(Date);
    expect(data.passwordChangedAt).toBeInstanceOf(Date);
    expect(db.phoneOtp.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("keeps the phone of an account whose email was already confirmed (control)", async () => {
    resetTokenOwner.mockResolvedValue(account({ emailVerified: new Date("2026-10-02") }));

    const res = await reset(post("/api/auth/reset", resetBody));

    expect(res.status).toBe(200);
    const { data } = db.user.update.mock.calls[0][0];
    expect(data).not.toHaveProperty("phone");
    expect(data).not.toHaveProperty("phoneVerified");
    expect(db.phoneOtp.deleteMany).not.toHaveBeenCalled();
  });
});
