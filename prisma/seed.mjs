import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL || "admin@mannmatters.in";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("ADMIN_PASSWORD is not set — add it to .env before seeding.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

await prisma.user.upsert({
  where: { email },
  update: { passwordHash, role: "ADMIN", emailVerified: new Date() },
  create: {
    name: "mann Matters Admin",
    email,
    passwordHash,
    role: "ADMIN",
    emailVerified: new Date(),
  },
});

console.log(`Admin account ready: ${email}`);
await prisma.$disconnect();
