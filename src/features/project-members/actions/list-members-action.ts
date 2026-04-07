"use server";

import type { ListMembersInput } from "@/features/project-members/contracts";
import { getServerProjectMembersRepository } from "@/features/project-members/repositories/server-project-members-repository";
import type { ProjectMember } from "@/features/project-members/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function listMembersAction(
  input: ListMembersInput
): Promise<ProjectMember[]> {
  await requireAuthenticatedActorId();
  const repository = await getServerProjectMembersRepository();

  return repository.listMembers(input);
}
