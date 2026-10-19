/**
 * The shared (Postgres-backed) rate limiter, against a RUNNING server.
 * Same guard and setup as access-control.test.ts: `npm run test:integration`.
 *
 * Each run uses its own made-up client IPs (X-Forwarded-For), so it never eats
 * into the budget of a real developer hitting the dev server from "local".
 */
import { createHmac } from "node:crypto";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

if (fs.existsSync(".env")) process.loadEnvFile(".env");

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const LOGIN_LIMIT = 8; // LIMITS.login in lib/rate-limit.ts

const prisma = new PrismaClient();
const run = `${Date.now() % 250}.${Math.floor(Math.random() * 250)}`;
const attackerIp = `198.51.${run.split(".")[1]}.${Number(run.split(".")[0]) + 1}`;
const bystanderIp = `203.0.${run.split(".")[1]}.${Number(run.split(".")[0]) + 1}`;

// mirrors limitKey() in lib/rate-limit.ts
const keyFor = (name: string, identifier: string) =>
  `${name}:${createHmac("sha256", process.env.AUTH_SECRET ?? "").update(identifier).digest("hex").slice(0, 32)}`;

function login(ip: string) {
  return fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { Origin: BASE, "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify({ email: `nobody-${run}@idor-test.invalid`, password: "wrong-password" }),
  });
}

beforeAll(async () => {
  const appEnv = process.env.APP_ENV ?? "";
  const localHost = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(process.env.DATABASE_URL ?? "");
  if (appEnv === "production" || (!localHost && appEnv !== "development" && appEnv !== "ci")) {
    throw new Error('Refusing to run: set APP_ENV="development" (or "ci") for a non-production database.');
  }
  try {
    await fetch(BASE + "/api/auth/me");
  } catch {
    throw new Error(`No server at ${BASE}. Start one first: npm run dev`);
  }
});

afterAll(async () => {
  await prisma.rateLimit.deleteMany({
    where: { key: { in: [keyFor("login", attackerIp), keyFor("login", bystanderIp)] } },
  });
  await prisma.$disconnect();
});

describe("login rate limit (shared store)", () => {
  it(`allows ${LOGIN_LIMIT} failed attempts, with the generic error`, async () => {
    for (let i = 0; i < LOGIN_LIMIT; i++) {
      const res = await login(attackerIp);
      expect(res.status).not.toBe(429);
      const body = await res.json();
      expect(JSON.stringify(body)).not.toMatch(/no such user|not found|doesn't exist|does not exist/i);
    }
  });

  it("blocks the next attempt with 429", async () => {
    const res = await login(attackerIp);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it("keeps the count in Postgres, so every server instance sees it", async () => {
    const row = await prisma.rateLimit.findUnique({ where: { key: keyFor("login", attackerIp) } });
    expect(row).not.toBeNull();
    expect(row!.count).toBe(LOGIN_LIMIT + 1);
    expect(row!.resetAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("stores no raw IP address", async () => {
    const leaked = await prisma.rateLimit.count({ where: { key: { contains: attackerIp } } });
    expect(leaked).toBe(0);
  });

  it("does not block a different client", async () => {
    const res = await login(bystanderIp);
    expect(res.status).not.toBe(429);
  });

  it("opens a fresh window once the old one has ended", async () => {
    await prisma.rateLimit.update({
      where: { key: keyFor("login", attackerIp) },
      data: { resetAt: new Date(Date.now() - 1000) },
    });
    const res = await login(attackerIp);
    expect(res.status).not.toBe(429);
    const row = await prisma.rateLimit.findUnique({ where: { key: keyFor("login", attackerIp) } });
    expect(row!.count).toBe(1);
  });
});
