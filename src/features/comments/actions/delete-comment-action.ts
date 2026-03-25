"use server";

import { revalidatePath } from "next/cache";
import type { DeleteCommentInput } from "@/features/comments/contracts";
import { SupabaseCommentsRepository } from "@/features/comments/repositories/SupabaseCommentsRepository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function deleteCommentAction(
  input: DeleteCommentInput
): Promise<void> {
  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseCommentsRepository(supabase);

  await repository.deleteComment(input);

  // Revalidate issue detail page
  // We need to fetch the issueId first or pass it in
  // For now, revalidate the project page
  revalidatePath("/projects", "layout");
}
