import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

/**
 * Give someone admin access.
 *
 *   node scripts/add-admin.mjs someone@example.com
 *
 * ── WHY IT DOES NOT SET A PASSWORD ──────────────────────────────────────────
 * The account is created with 64 random hex characters, hashed and thrown
 * away. Nobody — including whoever ran this — holds a string that opens it.
 * The new admin gets in by using "Forgot password" on the sign-in page, which
 * sends a real link to that inbox and lets them choose their own.
 *
 * That is deliberate. A password typed here would be read aloud over a call or
 * pasted into a chat, and it would stay there long after it stopped being a
 * secret. It also means this script proves the address receives mail, which is
 * the whole point of a second admin: a recovery path that actually works.
 *
 * ── ON AN EXISTING ACCOUNT ──────────────────────────────────────────────────
 * An address that is already a client is refused. Promoting a client to admin
 * would silently hand them every other client's records, and their own
 * bookings would vanish from the client list, which filters on role. Use a
 * different address.
 *
 * An address that is already an admin is left completely alone — this will not
 * reset a working admin's password by accident.
 */

const email = (process.argv[2] ?? "").trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error("Usage: node scripts/add-admin.mjs someone@example.com");
  process.exit(1);
}

const prisma = new PrismaClient();

const existing = await prisma.user.findUnique({
  where: { email },
  select: { id: true, role: true, name: true },
});

if (existing?.role === "ADMIN") {
  console.log(`${email} is already an admin. Nothing changed.`);
  await prisma.$disconnect();
  process.exit(0);
}

if (existing) {
  console.error(
    `${email} already exists as a ${existing.role} account. Pick an address that is not already in use —\n` +
      "promoting a client would give them every other client's records."
  );
  await prisma.$disconnect();
  process.exit(1);
}

const user = await prisma.user.create({
  data: {
    name: "Emoraa Admin",
    email,
    // unusable on purpose: there is no string that opens this account yet
    passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
    role: "ADMIN",
  },
  select: { id: true, email: true },
});

await prisma.auditEvent.create({
  data: {
    actorId: "cli",
    actorEmail: "scripts/add-admin.mjs",
    actorRole: "SYSTEM",
    action: "admin.create",
    subject: "user",
    subjectId: user.id,
    summary: `Created an admin account for ${user.email}`,
    meta: "{}",
  },
}).catch(() => {});

console.log(`\n  Admin account created: ${user.email}`);
console.log("\n  To set the password:");
console.log("    1. Open /forgot-password");
console.log(`    2. Enter ${user.email}`);
console.log("    3. Follow the link that arrives and choose a password");
console.log("\n  No password was set here, so nothing to copy and nothing to leak.\n");

await prisma.$disconnect();
