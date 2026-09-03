import { NextResponse } from "next/server";

/**
 * Shared response helpers for every route handler.
 *
 * Two rules this file exists to enforce:
 *  1. Nothing about a logged-in person is ever cacheable — by a CDN, a proxy,
 *     or the browser's back-forward cache.
 *  2. Errors leave the server as a stable `{ error, code, fields? }` envelope.
 *     Stack traces, Prisma messages, and gateway payloads never reach a client.
 */

export type FieldErrors = Record<string, string>;

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
};

/** A response carrying data about a specific person. Never cached. */
export function privateJson(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: PRIVATE_HEADERS,
  });
}

export function fail(
  status: number,
  error: string,
  extra?: { code?: string; fields?: FieldErrors; [k: string]: unknown }
) {
  return NextResponse.json({ error, ...extra }, { status, headers: PRIVATE_HEADERS });
}

export const errors = {
  badBody: () => fail(400, "We couldn't read that request. Please try again.", { code: "BAD_BODY" }),
  unauthenticated: () =>
    fail(401, "Please log in to continue.", { code: "UNAUTHENTICATED" }),
  forbidden: () => fail(403, "You don't have access to that.", { code: "FORBIDDEN" }),
  notFound: (what = "That couldn't be found.") => fail(404, what, { code: "NOT_FOUND" }),
  validation: (fields: FieldErrors, message = "Please check the highlighted fields.") =>
    fail(422, message, { code: "VALIDATION", fields }),
  rateLimited: (retryAfterSeconds: number) =>
    NextResponse.json(
      {
        error: "Too many attempts. Please wait a moment and try again.",
        code: "RATE_LIMITED",
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: { ...PRIVATE_HEADERS, "Retry-After": String(retryAfterSeconds) },
      }
    ),
  crossOrigin: () => fail(403, "Request blocked for your safety.", { code: "CROSS_ORIGIN" }),
  server: () =>
    fail(500, "Something went wrong on our side. Please try again in a moment.", {
      code: "SERVER_ERROR",
    }),
};

/**
 * Reject state-changing requests that didn't originate from our own pages.
 * `sameSite=lax` already stops cross-site cookies on sub-requests, but a
 * top-level form POST from another origin still carries them — this closes it.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  // same-origin fetches from some browsers omit Origin on same-origin GET only;
  // for the POST/PATCH handlers that call this, a missing Origin is not expected.
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

/** Best-effort client key for rate limiting. Never stored, never logged. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return ip;
}

/** Parse a JSON body without letting a malformed payload throw. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as T) : null;
  } catch {
    return null;
  }
}

/**
 * Log an unexpected failure with enough to debug and nothing that identifies a
 * person or exposes a secret. Emails, tokens, and card data never come here.
 */
export function logFailure(scope: string, err: unknown) {
  const message = err instanceof Error ? err.message : "unknown error";
  console.error(`[${scope}] ${message}`);
}
