import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PostList, { type PostRowView } from "@/components/posts/PostList";
import type { Role } from "@/lib/post-policy";

export const metadata: Metadata = { title: "Posts" };
export const dynamic = "force-dynamic";

/**
 * A practitioner's own posts.
 *
 * The `where` clause is the access rule. A post somebody may not see is never
 * read out of the database, rather than fetched and filtered afterwards.
 */
export default async function PostsPage() {
  const session = await getSession();
  if (!session || session.role !== "EXPERT" && session.role !== "ADMIN") notFound();

  const rows = await prisma.post.findMany({
    where: { authorId: session.sub },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      authorId: true,
      authorName: true,
      reviewNote: true,
      publishedAt: true,
      updatedAt: true,
      readMinutes: true,
    },
  });

  const posts: PostRowView[] = rows.map((r) => ({
    ...r,
    status: r.status as PostRowView["status"],
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="h-display text-3xl md:text-4xl">Your posts</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/70">Write for the Emoraa blog. Save a draft as you go, then send it for review — an admin reads it before it goes live.</p>
      </div>
      <PostList
        posts={posts}
        me={{ id: session.sub, role: session.role as Role }}
        basePath="/expert/posts"
      />
    </div>
  );
}
