import { createPost, listPosts } from "@/lib/post-api";

/**
 * A practitioner's own posts.
 *
 * Both portals mount the same handlers; everything about who may see or do
 * what lives in `lib/post-policy.ts`, so these two files cannot drift apart.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return listPosts();
}

export async function POST(req: Request) {
  return createPost(req);
}
