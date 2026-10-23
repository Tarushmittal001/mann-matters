import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PostEditor, { type EditablePost } from "@/components/posts/PostEditor";
import { blocksOf, takeawaysOf } from "@/lib/blog";
import type { Role } from "@/lib/post-policy";

export const metadata: Metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") notFound();

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  // a practitioner may only open their own; 404 so the response does not
  // confirm that somebody else's draft exists
  if (!post || (session.role !== "ADMIN" && post.authorId !== session.sub)) notFound();

  const editable: EditablePost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    body: blocksOf(post.body),
    takeaways: takeawaysOf(post.takeaways),
    status: post.status as EditablePost["status"],
    authorId: post.authorId,
    authorName: post.authorName,
    reviewNote: post.reviewNote,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  };

  return (
    <div>
      <Link href="/admin/posts" className="link-draw text-sm font-medium text-forest-700">
        ← All posts
      </Link>
      <h1 className="h-display mt-4 text-3xl md:text-4xl">{post.title}</h1>
      <p className="mt-2 text-[0.9rem] text-ink/70">
        By {post.authorName} · {post.authorRole}
      </p>
      <div className="mt-8">
        <PostEditor
          post={editable}
          me={{ id: session.sub, role: session.role as Role }}
          basePath="/admin/posts"
        />
      </div>
    </div>
  );
}
