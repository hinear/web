"use server";

import { revalidatePath } from "next/cache";
import type { CreateCommentInput } from "@/features/comments/contracts";
import {
  normalizeLineEndings,
  sanitizeCommentBody,
} from "@/features/comments/lib/comment-sanitization";
import { assertValidCreateCommentInput } from "@/features/comments/lib/comment-validation";
import { SupabaseCommentsRepository } from "@/features/comments/repositories/SupabaseCommentsRepository";
import type { Comment } from "@/features/comments/types";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function createCommentAction(
  input: CreateCommentInput
): Promise<Comment> {
  // Validate input
  assertValidCreateCommentInput(input);

  // Sanitize body
  const sanitizedBody = sanitizeCommentBody(normalizeLineEndings(input.body));

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseCommentsRepository(supabase);

  const comment = await repository.createComment({
    ...input,
    body: sanitizedBody,
  });

  // Revalidate issue detail page
  revalidatePath(`/projects/${input.projectId}/issues/${input.issueId}`);

  return comment;
}
