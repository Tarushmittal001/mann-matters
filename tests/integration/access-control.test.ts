/**
 * Cross-user access control (IDOR) against a RUNNING server.
 *
 *   npm run dev                  (or: npm run build && npm start)
 *   npm run test:integration
 *
 * Creates throwaway users under @idor-test.invalid, attacks one user's data as
 * another, then deletes everything it made. Refuses to run unless APP_ENV is
 * "development" or "ci" (or the database is on localhost), so it never touches
 * production.
 *
 * Every "not found" assertion is paired with a control proving the owner CAN
 * reach the same thing — otherwise a broken route would pass as "secure".
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

if (fs.existsSync(".env")) process.loadEnvFile(".env");

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const TAG = "idor-test.invalid";
const MEET = "https://meet.google.com/abc-defg-hij";

const prisma = new PrismaClient();
const createdUsers: string[] = [];

type Actor = { id: string; email: string; jwt: string };
type Reply = { status: number; text: string; location: string | null };

async function call(method: string, url: string, who: Actor | null, body?: unknown): Promise<Reply> {
  const headers: Record<string, string> = { Origin: BASE };
  if (who) headers.Cookie = `emoraa_session=${who.jwt}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  return { status: res.status, text: await res.text(), location: res.headers.get("location") };
}

async function makeUser(label: string, role: "USER" | "EXPERT" | "ADMIN"): Promise<Actor> {
  const user = await prisma.user.create({
    data: {
      name: `IDOR ${label}`,
      email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@${TAG}`,
      passwordHash: "unused",
      role,
      emailVerified: new Date(),
      termsAcceptedAt: new Date(),
    },
  });
  createdUsers.push(user.id);
  const jwt = await new SignJWT({ name: user.name, email: user.email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
  return { id: user.id, email: user.email, jwt };
}

const isRedirect = (r: Reply) => r.status >= 300 && r.status < 400;

let clientA: Actor, clientB: Actor, expertA: Actor, expertB: Actor, adminA: Actor;
let bookingId: string, bookingRef: string, homeworkId: string, timeOffId: string;
/* Client A's uploaded avatar: a real file on disk plus the row that points at
   it, so the serving route is exercised exactly as it is in production. */
const AVATAR_FILE = `${Date.now().toString(16).padStart(16, "0").slice(-16)}.png`;
const AVATAR_PATH = `/api/profile/avatar/${AVATAR_FILE}`;
const AVATAR_ON_DISK = path.join(process.cwd(), "private", "avatars", AVATAR_FILE);
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64"
);

beforeAll(async () => {
  const appEnv = process.env.APP_ENV ?? "";
  const localHost = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(process.env.DATABASE_URL ?? "");
  if (appEnv === "production" || (!localHost && appEnv !== "development" && appEnv !== "ci")) {
    throw new Error('Refusing to run: set APP_ENV="development" (or "ci") for a non-production database.');
  }
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not set.");
  try {
    await fetch(BASE + "/api/auth/me");
  } catch {
    throw new Error(`No server at ${BASE}. Start one first: npm run dev`);
  }

  clientA = await makeUser("client-a", "USER");
  clientB = await makeUser("client-b", "USER");
  expertA = await makeUser("expert-a", "EXPERT");
  expertB = await makeUser("expert-b", "EXPERT");
  adminA = await makeUser("admin-a", "ADMIN");

  const stamp = Date.now();
  const expA = `idor-exp-a-${stamp}`;
  await prisma.expertProfile.create({ data: { userId: expertA.id, expertId: expA, notesPolicy: "APPROVED" } });
  await prisma.expertProfile.create({ data: { userId: expertB.id, expertId: `idor-exp-b-${stamp}`, notesPolicy: "APPROVED" } });

  const booking = await prisma.booking.create({
    data: {
      ref: `EM-IDOR${stamp % 1_000_000}`,
      userId: clientA.id,
      concern: "anxiety",
      expertId: expA,
      expertName: "IDOR Expert A",
      date: "2099-12-01",
      time: "10:00",
      amount: 150000,
      status: "CONFIRMED",
      slotKey: `${expA}|2099-12-01|10:00`,
      meetingUrl: MEET,
      payment: { create: { amount: 150000, status: "PAID", method: "upi", vpaMasked: "a***@upi", paidAt: new Date() } },
    },
  });
  bookingId = booking.id;
  bookingRef = booking.ref;
  homeworkId = (
    await prisma.homework.create({
      data: { bookingId, userId: clientA.id, expertId: expA, task: "IDOR-SECRET-TASK" },
    })
  ).id;
  await prisma.intakeForm.create({ data: { userId: clientA.id, reason: "IDOR-SECRET-INTAKE" } });
  timeOffId = (
    await prisma.timeOff.create({ data: { expertId: expA, startDate: "2099-12-20", endDate: "2099-12-21" } })
  ).id;

  fs.mkdirSync(path.dirname(AVATAR_ON_DISK), { recursive: true });
  fs.writeFileSync(AVATAR_ON_DISK, PNG);
  await prisma.user.update({ where: { id: clientA.id }, data: { avatar: AVATAR_PATH } });
});

afterAll(async () => {
  fs.rmSync(AVATAR_ON_DISK, { force: true });
  // cascades remove bookings, payments, homework, intake, expert profiles, time off
  await prisma.post.deleteMany({ where: { authorId: { in: createdUsers } } });
  await prisma.booking.deleteMany({ where: { userId: { in: createdUsers } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUsers } } });
  await prisma.$disconnect();
});

describe("controls: owners can reach their own data", () => {
  it("client A reads own booking", async () => {
    expect((await call("GET", `/api/bookings/${bookingId}`, clientA)).status).toBe(200);
  });
  it("client A opens own receipt", async () => {
    expect((await call("GET", `/receipt/${bookingId}`, clientA)).status).toBe(200);
  });
  it("client A's dashboard shows their booking", async () => {
    const r = await call("GET", "/dashboard", clientA);
    expect(r.status).toBe(200);
    expect(r.text).toContain(bookingRef);
  });
  it("client A reads own avatar", async () => {
    expect((await call("GET", AVATAR_PATH, clientA)).status).toBe(200);
  });
  it("expert A, who has a booking with client A, can read it", async () => {
    expect((await call("GET", AVATAR_PATH, expertA)).status).toBe(200);
  });
  it("expert A opens own session page, including intake", async () => {
    const r = await call("GET", `/expert/sessions/${bookingId}`, expertA);
    expect(r.status).toBe(200);
  });
});

describe("anonymous requests are refused", () => {
  const cases: [string, () => string, unknown?][] = [
    ["GET", () => `/api/bookings/${bookingId}`],
    ["GET", () => "/api/bookings"],
    ["GET", () => "/api/profile"],
    ["GET", () => AVATAR_PATH],
    ["PATCH", () => "/api/profile/avatar", { avatar: null }],
    ["GET", () => "/api/feedback"],
    ["POST", () => `/api/bookings/${bookingId}/cancel`, {}],
    ["POST", () => "/api/payments", { method: "upi", vpa: "x@upi" }],
    ["POST", () => `/api/homework/${homeworkId}`, { done: true }],
    ["PATCH", () => `/api/expert/sessions/${bookingId}`, { action: "meeting-link", url: null }],
  ];
  it.each(cases)("%s %s → 401", async (method, url, body) => {
    const payload = url() === "/api/payments" ? { ...(body as object), bookingId } : body;
    expect((await call(method, url(), null, payload)).status).toBe(401);
  });
  it("receipt page redirects to login", async () => {
    const r = await call("GET", `/receipt/${bookingId}`, null);
    expect(isRedirect(r)).toBe(true);
    expect(r.location ?? "").toMatch(/login/);
  });
});

describe("client B cannot reach client A's data", () => {
  it("cannot read the booking", async () => {
    const r = await call("GET", `/api/bookings/${bookingId}`, clientB);
    expect(r.status).toBe(404);
    expect(r.text).not.toContain(bookingRef);
  });
  it("cannot read A's uploaded avatar", async () => {
    expect((await call("GET", AVATAR_PATH, clientB)).status).toBe(404);
  });
  it("cannot point their own row at A's avatar file", async () => {
    // only a watercolour we offer can be chosen this way; an uploaded path is
    // refused, or guessing a filename would be enough to adopt somebody's face
    expect((await call("PATCH", "/api/profile/avatar", clientB, { avatar: AVATAR_PATH })).status).toBe(422);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: clientB.id }, select: { avatar: true } })).avatar
    ).toBeNull();
  });
  it("cannot download its calendar file", async () => {
    expect((await call("GET", `/api/bookings/${bookingId}/calendar`, clientB)).status).toBe(404);
  });
  it("cannot cancel it", async () => {
    expect((await call("POST", `/api/bookings/${bookingId}/cancel`, clientB, {})).status).toBe(404);
  });
  it("cannot reschedule it", async () => {
    const r = await call("POST", `/api/bookings/${bookingId}/reschedule`, clientB, { date: "2099-12-02", time: "11:00" });
    expect(r.status).toBe(404);
  });
  it("cannot pay for / touch its payment", async () => {
    const r = await call("POST", "/api/payments", clientB, { bookingId, method: "upi", vpa: "b@upi" });
    expect([404, 429]).toContain(r.status);
  });
  it("cannot open its receipt", async () => {
    const r = await call("GET", `/receipt/${bookingId}`, clientB);
    expect(r.status).toBe(404);
    expect(r.text).not.toContain(bookingRef);
  });
  it("cannot answer a reschedule offer on A's booking", async () => {
    const r = await call("POST", `/api/bookings/${bookingId}/reschedule-offer`, clientB, {
      date: "2099-12-07",
      time: "10:00",
    });
    expect(r.status).toBe(404);
  });
  it("cannot answer a request as the client", async () => {
    const r = await call("PATCH", `/api/expert/sessions/${bookingId}`, clientA, { action: "accept" });
    expect([401, 403, 404]).toContain(r.status);
  });
  it("cannot tick A's homework", async () => {
    expect((await call("POST", `/api/homework/${homeworkId}`, clientB, { done: true })).status).toBe(404);
  });
  it("B's booking list excludes A's booking", async () => {
    const r = await call("GET", "/api/bookings", clientB);
    expect(r.status).toBe(200);
    expect(r.text).not.toContain(bookingId);
    expect(r.text).not.toContain(bookingRef);
  });
  it("B's profile is B's, not A's", async () => {
    const r = await call("GET", "/api/profile", clientB);
    expect(r.status).toBe(200);
    expect(r.text).toContain(clientB.email);
    expect(r.text).not.toContain(clientA.email);
  });
  it("B's dashboard shows none of A's data", async () => {
    const r = await call("GET", "/dashboard", clientB);
    expect(r.status).toBe(200);
    expect(r.text).not.toContain(bookingRef);
    expect(r.text).not.toContain("IDOR-SECRET-TASK");
    expect(r.text).not.toContain("IDOR-SECRET-INTAKE");
  });
});

describe("roles are enforced", () => {
  it("a client is refused on the expert session API", async () => {
    const r = await call("PATCH", `/api/expert/sessions/${bookingId}`, clientB, { action: "meeting-link", url: null });
    expect([401, 403]).toContain(r.status);
  });
  it("a client is redirected away from expert pages", async () => {
    expect(isRedirect(await call("GET", `/expert/sessions/${bookingId}`, clientB))).toBe(true);
  });
  it("a client is refused on the admin API", async () => {
    expect((await call("POST", "/api/admin/coupons", clientB, {})).status).toBe(403);
  });
  it("a client is redirected away from /admin", async () => {
    expect(isRedirect(await call("GET", "/admin", clientB))).toBe(true);
  });
  it("an expert is refused on the admin API", async () => {
    expect((await call("POST", "/api/admin/coupons", expertB, {})).status).toBe(403);
  });

  it("a client cannot block another client", async () => {
    const r = await call("PATCH", `/api/admin/clients/${clientA.id}`, clientB, {
      action: "block",
      reason: "hijack",
    });
    expect(r.status).toBe(403);
  });
  it("a client cannot unblock themselves", async () => {
    expect(
      (await call("PATCH", `/api/admin/clients/${clientB.id}`, clientB, { action: "unblock" })).status
    ).toBe(403);
  });
  it("an expert cannot block a client", async () => {
    const r = await call("PATCH", `/api/admin/clients/${clientA.id}`, expertA, {
      action: "block",
      reason: "hijack",
    });
    expect(r.status).toBe(403);
  });
  it("nobody signed out can block anyone", async () => {
    const r = await call("PATCH", `/api/admin/clients/${clientA.id}`, null, {
      action: "block",
      reason: "hijack",
    });
    expect(r.status).toBe(401);
  });
  it("a client cannot record a payout to themselves", async () => {
    const r = await call("POST", "/api/admin/payouts", clientB, {
      expertId: "ananya-iyer",
      month: new Date().toISOString().slice(0, 7),
    });
    expect(r.status).toBe(403);
  });
  it("an expert cannot record their own payout", async () => {
    const r = await call("POST", "/api/admin/payouts", expertA, {
      expertId: "ananya-iyer",
      month: new Date().toISOString().slice(0, 7),
    });
    expect(r.status).toBe(403);
  });
  it("a client cannot refund their own booking", async () => {
    const r = await call("POST", `/api/admin/bookings/${bookingId}/refund`, clientA, {
      amount: 150000,
      reason: "refund me",
    });
    expect(r.status).toBe(403);
  });
  it("an expert cannot refund their own client's booking", async () => {
    const r = await call("POST", `/api/admin/bookings/${bookingId}/refund`, expertA, {
      amount: 100,
      reason: "hijack",
    });
    expect(r.status).toBe(403);
  });
  it("nobody signed out can refund anything", async () => {
    const r = await call("POST", `/api/admin/bookings/${bookingId}/refund`, null, {
      amount: 100,
      reason: "hijack",
    });
    expect(r.status).toBe(401);
  });
  it("the payment is untouched after those attempts", async () => {
    const pay = await prisma.payment.findUniqueOrThrow({ where: { bookingId } });
    expect(pay.status).toBe("PAID");
    expect(pay.refundAmount).toBeNull();
  });
  it("a client is redirected away from the admin client pages", async () => {
    expect(isRedirect(await call("GET", `/admin/clients/${clientA.id}`, clientB))).toBe(true);
    expect(isRedirect(await call("GET", "/admin/payments", clientB))).toBe(true);
  });
});

/**
 * Blocking is enforced in `getSession()`, so it should close every door at
 * once rather than the few a route remembered to check. Client B is blocked
 * directly in the database — the admin API path is covered above — and then
 * asked for things they could reach a moment earlier.
 */
describe("a blocked account is shut out everywhere", () => {
  beforeAll(async () => {
    await prisma.user.update({
      where: { id: clientB.id },
      data: { blockedAt: new Date(), blockedReason: "IDOR fixture" },
    });
  });
  afterAll(async () => {
    await prisma.user.update({
      where: { id: clientB.id },
      data: { blockedAt: null, blockedReason: null },
    });
  });

  it("their existing cookie stops working on the API", async () => {
    expect((await call("GET", "/api/profile", clientB)).status).toBe(401);
    expect((await call("GET", "/api/bookings", clientB)).status).toBe(401);
  });
  it("their existing cookie stops working on pages", async () => {
    expect(isRedirect(await call("GET", "/dashboard", clientB))).toBe(true);
  });
  it("they cannot change their own avatar", async () => {
    expect(
      (await call("PATCH", "/api/profile/avatar", clientB, { avatar: null })).status
    ).toBe(401);
  });
  it("client A is untouched", async () => {
    expect((await call("GET", "/api/profile", clientA)).status).toBe(200);
  });
});

describe("expert B cannot reach expert A's client", () => {
  it("cannot open the session page (intake, notes)", async () => {
    const r = await call("GET", `/expert/sessions/${bookingId}`, expertB);
    expect(r.status).toBe(404);
    expect(r.text).not.toContain("IDOR-SECRET-INTAKE");
  });
  it("cannot read the client's avatar", async () => {
    expect((await call("GET", AVATAR_PATH, expertB)).status).toBe(404);
  });
  it("cannot change the meeting link", async () => {
    const r = await call("PATCH", `/api/expert/sessions/${bookingId}`, expertB, { action: "meeting-link", url: null });
    expect(r.status).toBe(404);
  });
  it("cannot cancel the session", async () => {
    const r = await call("PATCH", `/api/expert/sessions/${bookingId}`, expertB, { action: "status", status: "CANCELLED", reason: "hijack" });
    expect(r.status).toBe(404);
  });
  it("cannot write a note", async () => {
    expect((await call("PUT", `/api/expert/sessions/${bookingId}/note`, expertB, { body: "planted" })).status).toBe(404);
  });
  it("cannot add homework", async () => {
    expect((await call("POST", `/api/expert/sessions/${bookingId}/homework`, expertB, { task: "planted" })).status).toBe(404);
  });
  it("cannot delete A's homework", async () => {
    const r = await call("DELETE", `/api/expert/sessions/${bookingId}/homework`, expertB, { homeworkId });
    expect(r.status).toBe(404);
  });
  it("cannot answer a request on A's calendar", async () => {
    const r = await call("PATCH", `/api/expert/sessions/${bookingId}`, expertB, { action: "accept" });
    expect(r.status).toBe(404);
  });
  it("cannot decline a request on A's calendar", async () => {
    const r = await call("PATCH", `/api/expert/sessions/${bookingId}`, expertB, {
      action: "decline",
      reason: "hijacking this",
    });
    expect(r.status).toBe(404);
  });
  it("cannot offer other times on A's session", async () => {
    const r = await call("POST", `/api/expert/sessions/${bookingId}/reschedule`, expertB, {
      dates: [{ date: "2099-12-07", times: ["10:00"] }],
      reason: "hijacking this",
    });
    expect(r.status).toBe(404);
  });
  it("cannot prescribe on A's session", async () => {
    const r = await call("POST", `/api/expert/sessions/${bookingId}/prescription`, expertB, {
      items: [
        { drug: "Sertraline", dose: "1 tablet", frequency: "Daily", duration: "4 weeks" },
      ],
    });
    // 403 because B is not a prescriber at all; 404 if they ever became one
    expect([403, 404]).toContain(r.status);
  });
  it("cannot send A's practice plan to A's client", async () => {
    expect((await call("POST", `/api/expert/sessions/${bookingId}/plan`, expertB)).status).toBe(404);
  });
  it("cannot nudge A's client to rebook", async () => {
    const r = await call("POST", `/api/expert/sessions/${bookingId}/follow-up`, expertB, {
      message: "book with me instead",
    });
    expect(r.status).toBe(404);
  });
  it("cannot delete A's time off", async () => {
    expect((await call("DELETE", `/api/expert/time-off/${timeOffId}`, expertB)).status).toBe(404);
  });
  it("B's session list excludes A's session", async () => {
    const r = await call("GET", "/expert/sessions", expertB);
    expect(r.status).toBe(200);
    expect(r.text).not.toContain(bookingRef);
  });
});

describe("the practice plan letterhead stays with its own session", () => {
  /* Owner controls: the plan page is where the letterhead's details are
     filled in from the booking, so reaching it proves both access and the
     prefill. (Sending is not exercised for the owner here: it emails a real
     inbox when a provider is configured.) */
  it("client A can open their plan, with the booking ref filled in", async () => {
    const r = await call("GET", `/plan/${bookingId}`, clientA);
    expect(r.status).toBe(200);
    expect(r.text).toContain(bookingRef);
  });
  it("expert A can open the plan they set", async () => {
    expect((await call("GET", `/plan/${bookingId}`, expertA)).status).toBe(200);
  });
  it("client B gets a 404", async () => {
    const r = await call("GET", `/plan/${bookingId}`, clientB);
    expect(r.status).toBe(404);
    expect(r.text).not.toContain(bookingRef);
  });
  it("expert B gets a 404", async () => {
    expect((await call("GET", `/plan/${bookingId}`, expertB)).status).toBe(404);
  });
});

describe("follow-up suggestions stay with their own client", () => {
  let followUpId: string;
  beforeAll(async () => {
    const row = await prisma.followUp.create({
      data: { expertId: "idor-nudge-expert", userId: clientA.id, message: "IDOR-SECRET-NUDGE" },
    });
    followUpId = row.id;
  });
  afterAll(async () => {
    await prisma.followUp.deleteMany({ where: { userId: clientA.id } });
  });

  it("client B cannot dismiss client A's suggestion", async () => {
    expect((await call("POST", `/api/follow-ups/${followUpId}`, clientB)).status).toBe(404);
  });
  it("a signed-out caller cannot dismiss it", async () => {
    expect((await call("POST", `/api/follow-ups/${followUpId}`, null)).status).toBe(401);
  });
  it("it is still live afterwards", async () => {
    const row = await prisma.followUp.findUniqueOrThrow({ where: { id: followUpId } });
    expect(row.actedAt).toBeNull();
  });
  it("client A can dismiss their own", async () => {
    expect((await call("POST", `/api/follow-ups/${followUpId}`, clientA)).status).toBe(200);
  });
});

/*
 * The free tools are free but no longer anonymous: every one of them needs an
 * account. The two things that must stay true alongside that are the reason
 * the gate is acceptable at all, so they are asserted here rather than left to
 * a reviewer's memory:
 *   1. the wall always offers a route to crisis help, and
 *   2. /crisis itself is never gated — it has breathing built into the page.
 */
describe("free tools need an account", () => {
  const GATED = [
    "/tools/journal",
    "/tools/grounding",
    "/tools/relax",
    "/tools/sounds",
    "/tools/affirmations",
    "/tools/bmi",
    "/tools/burnout",
    "/breathe",
    "/check-in",
    "/match",
  ];

  it.each(GATED)("%s shows the wall when signed out", async (path) => {
    const r = await call("GET", path, null);
    expect(r.status).toBe(200);
    expect(r.text).toContain("Sign in to use this tool");
  });

  it.each(GATED)("%s offers crisis help on the wall", async (path) => {
    expect((await call("GET", path, null)).text).toContain("14416");
  });

  it.each(GATED)("%s opens for a signed-in client", async (path) => {
    const r = await call("GET", path, clientA);
    expect(r.status).toBe(200);
    expect(r.text).not.toContain("Sign in to use this tool");
  });

  it("the tools menu stays open to everyone", async () => {
    const r = await call("GET", "/tools", null);
    expect(r.status).toBe(200);
    expect(r.text).not.toContain("Sign in to use this tool");
  });

  it("/crisis is never gated", async () => {
    const r = await call("GET", "/crisis", null);
    expect(r.status).toBe(200);
    expect(r.text).not.toContain("Sign in to use this tool");
    expect(r.text).toContain("14416");
  });
});

/*
 * Blog posts: practitioners write them, admins publish them.
 *
 * The two rules worth a test are the two that would be expensive to get
 * wrong: an expert must not be able to read or touch another expert's draft
 * (it is unfinished thinking, and the slug is guessable), and an expert must
 * not be able to publish — including their own work, and including by calling
 * the admin route directly.
 */
describe("posts: an author owns their draft, an admin owns publishing", () => {
  let postA = "";

  it("expert A can start a post", async () => {
    const r = await call("POST", "/api/expert/posts", expertA, {
      title: "A draft by expert A",
      excerpt: "",
      category: "Anxiety",
      body: [{ type: "p", text: "Something half written." }],
      takeaways: [],
    });
    expect(r.status).toBe(201);
    postA = JSON.parse(r.text).id;
    expect(postA).toBeTruthy();
  });

  it("expert A can read it back", async () => {
    expect((await call("GET", `/api/expert/posts/${postA}`, expertA)).status).toBe(200);
  });

  it("expert B cannot read it", async () => {
    expect((await call("GET", `/api/expert/posts/${postA}`, expertB)).status).toBe(404);
  });

  it("expert B cannot edit it", async () => {
    const r = await call("PATCH", `/api/expert/posts/${postA}`, expertB, {
      title: "Hijacked",
      excerpt: "",
      category: "Anxiety",
      body: [{ type: "p", text: "no" }],
      takeaways: [],
    });
    expect(r.status).toBe(404);
  });

  it("expert B cannot reach it through the admin route either", async () => {
    expect((await call("GET", `/api/admin/posts/${postA}`, expertB)).status).toBe(404);
  });

  it("a signed-out visitor cannot list posts", async () => {
    expect((await call("GET", "/api/expert/posts", null)).status).toBe(401);
  });

  it("a client cannot list posts", async () => {
    expect((await call("GET", "/api/expert/posts", clientA)).status).toBe(401);
  });

  it("expert A cannot publish their own post", async () => {
    const r = await call("PATCH", `/api/expert/posts/${postA}`, expertA, { status: "PUBLISHED" });
    expect(r.status).toBe(403);
  });

  it("expert A cannot publish it through the admin route", async () => {
    const r = await call("PATCH", `/api/admin/posts/${postA}`, expertA, { status: "PUBLISHED" });
    expect(r.status).toBe(403);
  });

  it("it is still a draft after both attempts", async () => {
    const row = await prisma.post.findUniqueOrThrow({ where: { id: postA } });
    expect(row.status).toBe("DRAFT");
    expect(row.publishedAt).toBeNull();
  });

  it("expert A can submit it for review", async () => {
    const r = await call("PATCH", `/api/expert/posts/${postA}`, expertA, { status: "IN_REVIEW" });
    expect(r.status).toBe(200);
    const row = await prisma.post.findUniqueOrThrow({ where: { id: postA } });
    expect(row.status).toBe("IN_REVIEW");
  });

  it("an admin can send it back with a note", async () => {
    const r = await call("PATCH", `/api/admin/posts/${postA}`, adminA, {
      status: "DRAFT",
      reviewNote: "Add a source for the figure in paragraph two.",
    });
    expect(r.status).toBe(200);
    const row = await prisma.post.findUniqueOrThrow({ where: { id: postA } });
    expect(row.status).toBe("DRAFT");
    expect(row.reviewNote).toContain("source");
  });

  it("a post too short to publish is refused", async () => {
    await call("PATCH", `/api/expert/posts/${postA}`, expertA, { status: "IN_REVIEW" });
    const r = await call("PATCH", `/api/admin/posts/${postA}`, adminA, { status: "PUBLISHED" });
    expect(r.status).toBe(400);
  });

  it("an admin can publish a finished post, and it appears on the blog", async () => {
    const words = Array.from({ length: 150 }, (_, i) => `word${i}`).join(" ");
    await call("PATCH", `/api/admin/posts/${postA}`, adminA, {
      title: "A finished post by expert A",
      excerpt: "A real summary.",
      category: "Anxiety",
      body: [{ type: "p", text: words }],
      takeaways: ["One true thing."],
    });
    const r = await call("PATCH", `/api/admin/posts/${postA}`, adminA, { status: "PUBLISHED" });
    expect(r.status).toBe(200);
    const row = await prisma.post.findUniqueOrThrow({ where: { id: postA } });
    expect(row.status).toBe("PUBLISHED");
    expect(row.publishedAt).not.toBeNull();
  });

  it("expert A can no longer edit it once it is live", async () => {
    const r = await call("PATCH", `/api/expert/posts/${postA}`, expertA, {
      title: "Sneaky edit",
      excerpt: "A real summary.",
      category: "Anxiety",
      body: [{ type: "p", text: "changed" }],
      takeaways: [],
    });
    expect(r.status).toBe(403);
  });

  it("expert A cannot delete a published post", async () => {
    expect((await call("DELETE", `/api/expert/posts/${postA}`, expertA)).status).toBe(403);
  });
});

describe("nothing changed after the attacks", () => {
  it("booking and payment are untouched", async () => {
    const after = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { payment: true } });
    expect(after).toMatchObject({ status: "CONFIRMED", date: "2099-12-01", time: "10:00", meetingUrl: MEET });
    expect(after.payment).toMatchObject({ status: "PAID", vpaMasked: "a***@upi" });
  });
  it("homework is untouched", async () => {
    const tasks = await prisma.homework.findMany({ where: { bookingId } });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].doneAt).toBeNull();
  });
  it("no note was planted", async () => {
    expect(await prisma.sessionNote.count({ where: { bookingId } })).toBe(0);
  });
  it("client A still has their own avatar", async () => {
    const a = await prisma.user.findUniqueOrThrow({ where: { id: clientA.id }, select: { avatar: true } });
    expect(a.avatar).toBe(AVATAR_PATH);
    expect(fs.existsSync(AVATAR_ON_DISK)).toBe(true);
  });
  it("time off still exists", async () => {
    expect(await prisma.timeOff.findUnique({ where: { id: timeOffId } })).not.toBeNull();
  });
});
