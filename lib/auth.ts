import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "emoraa_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "USER" | "EXPERT" | "ADMIN";

export type Session = {
  sub: string;
  name: string;
  email: string;
  role: Role;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordChangedAt: true,
        blockedAt: true,
      },
    });
    if (!user || (user.role !== "USER" && user.role !== "EXPERT" && user.role !== "ADMIN")) {
      return null;
    }
    /* A blocked account has no session, anywhere. This lookup already happens
       on every request, so the check costs nothing and — more to the point —
       it closes every page and every API route at once. The alternative, each
       route remembering to ask, is the kind of rule that holds until somebody
       adds the route that forgets. A cookie minted before the block stops
       working on the blocker's next click, not at its expiry. */
    if (user.blockedAt) return null;
    // a password reset ends every session minted before it, so a stolen laptop
    // or a shared browser can't keep the old cookie alive
    if (user.passwordChangedAt && typeof payload.iat === "number") {
      if (payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) return null;
    }
    return {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
