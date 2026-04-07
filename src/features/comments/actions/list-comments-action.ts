"use server";

import type { ListCommentsInput } from "@/features/comments/contracts";
import { getServerCommentsRepository } from "@/features/comments/repositories/server-comments-repository";
import type { Comment } from "@/features/comments/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function listCommentsAction(
  input: ListCommentsInput
): Promise<Comment[]> {
  await requireAuthenticatedActorId();
  const repository = await getServerCommentsRepository();

  return repository.listCommentsByIssueId(input);
}
