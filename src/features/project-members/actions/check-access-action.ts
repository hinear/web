"use server";

import type { CheckAccessInput } from "@/features/project-members/contracts";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function checkAccessAction(
  input: CheckAccessInput
): Promise<boolean> {
  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseProjectMembersRepository(supabase);

  return repository.hasProjectPermission(
    input.projectId,
    input.userId,
    input.permission
  );
}
