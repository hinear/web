"use server";

import type { ListMembersInput } from "@/features/project-members/contracts";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import type { ProjectMember } from "@/features/project-members/types";
import { createClient } from "@/lib/supabase/server-client";

export async function listMembersAction(
  input: ListMembersInput
): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const repository = new SupabaseProjectMembersRepository(supabase);

  return repository.listMembers(input);
}
