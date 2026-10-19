import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Give every practitioner listing a login you can actually sign in with.
 *
 * For testing the expert portal, where the alternative is sending eleven real
 * invite emails to inboxes that do not exist. It creates the missing accounts,
 * links each one to its listing, and sets ONE shared password across all of
 * them so you can move between practitioners without a password manager.
 *
 * ── WHY IT IS GUARDED ──────────────────────────────────────────────────────
 * Eleven clinical accounts sharing a known password is a back door. So this
 * refuses to run anywhere it could matter:
 *
 *   - not when NODE_ENV or APP_ENV is production;
 *   - not unless APP_ENV is "development" or "ci", or the database is on localhost.
 *
 * Neither check is clever and both are easy to defeat on purpose. They are
 * here to stop an accident, not an attacker — the real protection is that the
 * passwords it sets are worthless once you rotate them, which `--revoke` does.
 *
 * ── USE ────────────────────────────────────────────────────────────────────
 *   node scripts/test-logins.mjs              set the logins up
 *   node scripts/test-logins.mjs --revoke     scramble every one of them again
 *
 * Override the password with TEST_EXPERT_PASSWORD. The default is fine for a
 * laptop and must never reach a deployed database.
 *
 * ── AFTERWARDS ─────────────────────────────────────────────────────────────
 * Run `--revoke` before this database goes anywhere real. It replaces every
 * practitioner password with 32 random bytes nobody holds, which locks the
 * accounts without deleting them — their names are on sessions and notes, so
 * deleting the users would orphan clinical records. Each practitioner then
 * gets back in the ordinary way: Admin → Experts → Manage → Send invite.
 */

const url = process.env.DATABASE_URL ?? "";
const revoke = process.argv.includes("--revoke");

const appEnv = process.env.APP_ENV ?? "";
if (process.env.NODE_ENV === "production" || appEnv === "production") {
  console.error("Refusing to run against production.");
  process.exit(1);
}
const localHost = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
if (!localHost && appEnv !== "development" && appEnv !== "ci") {
  console.error('Refusing to run: set APP_ENV="development" in .env for your dev database.');
  process.exit(1);
}

const PASSWORD = process.env.TEST_EXPERT_PASSWORD ?? "EmoraaTest2026!";
if (!revoke && PASSWORD.length < 10) {
  console.error("TEST_EXPERT_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();

/** "ananya-iyer" → "ananya-iyer@emoraa.com": the slug is already the local part. */
const emailFor = (slug) => `${slug}@emoraa.com`;

const experts = await prisma.expert.findMany({
  orderBy: { sortOrder: "asc" },
  select: { slug: true, name: true, status: true },
});

if (revoke) {
  let n = 0;
  for (const e of experts) {
    const user = await prisma.user.findUnique({
      where: { email: emailFor(e.slug) },
      select: { id: true },
    });
    if (!user) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // nobody holds this, and nobody can: it is never printed
        passwordHash: await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 10),
        // every session issued before now stops being accepted
        passwordChangedAt: new Date(),
      },
    });
    n++;
  }
  console.log(`Scrambled ${n} practitioner password${n === 1 ? "" : "s"}.`);
  console.log("They are locked out until each is sent an invite from Admin → Experts → Manage.");
  await prisma.$disconnect();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(PASSWORD, 10);
const rows = [];

for (const e of experts) {
  const email = emailFor(e.slug);

  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  let created = false;
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: e.name,
        email,
        passwordHash,
        role: "EXPERT",
        // reading the invite is what normally confirms an address; these
        // accounts skip the invite, so the confirmation is set here or the
        // admin screen would report them as unreachable
        emailVerified: new Date(),
      },
      select: { id: true, role: true },
    });
    created = true;
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        role: "EXPERT",
        emailVerified: new Date(),
        // sign out anything already holding a session on the old password
        passwordChangedAt: new Date(),
      },
    });
  }

  /*
   * Linked by SLUG. That is what bookings, availability rules and getExpert()
   * all use; a profile linked by the Expert row's cuid signs in fine and then
   * finds none of its own sessions.
   */
  const existing = await prisma.expertProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, expertId: true },
  });

  if (!existing) {
    await prisma.expertProfile.create({ data: { userId: user.id, expertId: e.slug } });
  } else if (existing.expertId !== e.slug) {
    await prisma.expertProfile.update({ where: { id: existing.id }, data: { expertId: e.slug } });
  }

  rows.push({ name: e.name, email, listed: e.status === "ACTIVE" ? "listed" : "hidden", created });
}

const pad = Math.max(...rows.map((r) => r.name.length));
console.log(`\n  Password for all of them:  ${PASSWORD}\n`);
for (const r of rows) {
  console.log(`  ${r.name.padEnd(pad)}  ${r.email.padEnd(30)} ${r.listed}${r.created ? "  (account created)" : ""}`);
}
console.log(`\n  ${rows.length} practitioner logins ready. Sign in at /login — they land on /expert.`);
console.log("  Run with --revoke before this database goes anywhere real.\n");

await prisma.$disconnect();
