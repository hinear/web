"use server";

import { revalidatePath } from "next/cache";
import type { CreateCommentActionInput } from "@/features/comments/contracts";
import {
  normalizeLineEndings,
  sanitizeCommentBody,
} from "@/features/comments/lib/comment-sanitization";
import { assertValidCreateCommentInput } from "@/features/comments/lib/comment-validation";
import { getServerCommentsRepository } from "@/features/comments/repositories/server-comments-repository";
import type { Comment } from "@/features/comments/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function createCommentAction(
  input: CreateCommentActionInput
): Promise<Comment> {
  const actorId = await requireAuthenticatedActorId();

  assertValidCreateCommentInput(input);

  const sanitizedBody = sanitizeCommentBody(normalizeLineEndings(input.body));
  const repository = await getServerCommentsRepository();

  const comment = await repository.createComment({
    ...input,
    authorId: actorId,
    body: sanitizedBody,
  });

  revalidatePath(`/projects/${input.projectId}/issues/${input.issueId}`);

  return comment;
}
