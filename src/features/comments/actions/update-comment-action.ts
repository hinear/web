"use server";

import { revalidatePath } from "next/cache";
import type { UpdateCommentInput } from "@/features/comments/contracts";
import {
  normalizeLineEndings,
  sanitizeCommentBody,
} from "@/features/comments/lib/comment-sanitization";
import { assertValidUpdateCommentInput } from "@/features/comments/lib/comment-validation";
import { SupabaseCommentsRepository } from "@/features/comments/repositories/SupabaseCommentsRepository";
import type { Comment } from "@/features/comments/types";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function updateCommentAction(
  input: UpdateCommentInput
): Promise<Comment> {
  // Validate input
  assertValidUpdateCommentInput(input);

  // Sanitize body
  const sanitizedBody = sanitizeCommentBody(normalizeLineEndings(input.body));

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseCommentsRepository(supabase);

  const comment = await repository.updateComment({
    commentId: input.commentId,
    body: sanitizedBody,
    updatedBy: input.updatedBy,
  });

  // Revalidate issue detail page
  // We need to fetch the issueId first or pass it in
  // For now, revalidate the project page
  revalidatePath("/projects", "layout");

  return comment;
}
