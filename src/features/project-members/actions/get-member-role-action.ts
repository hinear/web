"use server";

import type { GetMemberRoleInput } from "@/features/project-members/contracts";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import type { MemberRole } from "@/features/project-members/types";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function getMemberRoleAction(
  input: GetMemberRoleInput
): Promise<MemberRole | null> {
  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseProjectMembersRepository(supabase);

  return repository.getMemberRole(input);
}
