"use server";

import { revalidatePath } from "next/cache";
import type { DeleteCommentActionInput } from "@/features/comments/contracts";
import { getServerCommentsRepository } from "@/features/comments/repositories/server-comments-repository";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function deleteCommentAction(
  input: DeleteCommentActionInput
): Promise<void> {
  const actorId = await requireAuthenticatedActorId();
  const repository = await getServerCommentsRepository();

  await repository.deleteComment({
    commentId: input.commentId,
    deletedBy: actorId,
  });

  revalidatePath(`/projects/${input.projectId}`);
}
