/**
 * Copy the seven original essays out of lib/posts.ts and into the Post table.
 *
 * Run once, after the add_posts migration:
 *     node scripts/import-posts.mjs
 *
 * Safe to run again: posts are matched on slug and skipped if already there,
 * so a second run reports "already in" rather than creating duplicates or
 * overwriting edits somebody has since made in the admin.
 *
 * The essays keep their slugs, their dates and their bylines. Nothing about
 * the published pages changes — this only moves where they are stored.
 *
 * Authorship: each essay already names a psychologist. Those are editorial
 * bylines, not accounts, so the rows are attributed to an admin account (the
 * one that owns the content today) while `authorName` / `authorRole` keep the
 * byline the page has always shown.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

/* The essays as plain data. JSON on purpose: it is seed material for a fresh
   environment, and keeping it out of lib/ makes it impossible to import by
   accident as if it were live content. */
function loadPosts() {
  return JSON.parse(readFileSync("prisma/seed-posts.json", "utf8"));
}

function readMinutes(content) {
  const words = content.reduce((n, b) => n + b.text.trim().split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 200));
}

const admin = await prisma.user.findFirst({
  where: { role: "ADMIN" },
  orderBy: { createdAt: "asc" },
  select: { id: true },
});

if (!admin) {
  console.error("No ADMIN user found. Seed one first (scripts/add-admin.mjs).");
  process.exit(1);
}

const posts = loadPosts();
let created = 0;
let skipped = 0;

for (const p of posts) {
  const existing = await prisma.post.findUnique({ where: { slug: p.slug }, select: { id: true } });
  if (existing) {
    skipped++;
    console.log(`  already in   ${p.slug}`);
    continue;
  }
  await prisma.post.create({
    data: {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      body: p.content,
      takeaways: p.takeaways ?? [],
      cover: p.cover,
      coverAlt: p.coverAlt,
      deva: p.deva,
      readMinutes: readMinutes(p.content),
      toolHref: p.tool?.href || null,
      toolLabel: p.tool?.label || null,
      toolNote: p.tool?.note || null,
      status: "PUBLISHED",
      authorId: admin.id,
      authorName: p.author.name,
      authorRole: p.author.role,
      publishedAt: new Date(`${p.date}T09:00:00.000Z`),
      featured: Boolean(p.featured),
    },
  });
  created++;
  console.log(`  imported     ${p.slug}`);
}

console.log(`\n${created} imported, ${skipped} already present.`);
await prisma.$disconnect();
