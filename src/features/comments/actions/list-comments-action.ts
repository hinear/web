"use server";

import type { ListCommentsInput } from "@/features/comments/contracts";
import { SupabaseCommentsRepository } from "@/features/comments/repositories/SupabaseCommentsRepository";
import type { Comment } from "@/features/comments/types";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function listCommentsAction(
  input: ListCommentsInput
): Promise<Comment[]> {
  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseCommentsRepository(supabase);

  return repository.listCommentsByIssueId(input);
}
