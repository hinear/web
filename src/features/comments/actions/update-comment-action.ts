"use server";

import { revalidatePath } from "next/cache";
import type { UpdateCommentActionInput } from "@/features/comments/contracts";
import {
  normalizeLineEndings,
  sanitizeCommentBody,
} from "@/features/comments/lib/comment-sanitization";
import { assertValidUpdateCommentInput } from "@/features/comments/lib/comment-validation";
import { getServerCommentsRepository } from "@/features/comments/repositories/server-comments-repository";
import type { Comment } from "@/features/comments/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function updateCommentAction(
  input: UpdateCommentActionInput
): Promise<Comment> {
  const actorId = await requireAuthenticatedActorId();

  assertValidUpdateCommentInput(input);

  const sanitizedBody = sanitizeCommentBody(normalizeLineEndings(input.body));
  const repository = await getServerCommentsRepository();

  const comment = await repository.updateComment({
    commentId: input.commentId,
    body: sanitizedBody,
    updatedBy: actorId,
  });

  // TODO: pass projectId/issueId for targeted revalidation
  revalidatePath("/projects", "layout");

  return comment;
}
