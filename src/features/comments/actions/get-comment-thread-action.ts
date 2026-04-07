"use server";

import type { GetCommentThreadInput } from "@/features/comments/contracts";
import { getServerCommentsRepository } from "@/features/comments/repositories/server-comments-repository";
import type { CommentThread } from "@/features/comments/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function getCommentThreadAction(
  input: GetCommentThreadInput
): Promise<CommentThread> {
  await requireAuthenticatedActorId();
  const repository = await getServerCommentsRepository();

  return repository.getCommentThread(input);
}
