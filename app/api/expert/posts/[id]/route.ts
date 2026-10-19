import { deletePost, getPost, updatePost } from "@/lib/post-api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return getPost(params.id);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return updatePost(req, params.id);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return deletePost(params.id);
}
