"use server";

import type { GetMemberRoleActionInput } from "@/features/project-members/contracts";
import { getServerProjectMembersRepository } from "@/features/project-members/repositories/server-project-members-repository";
import type { MemberRole } from "@/features/project-members/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function getMemberRoleAction(
  input: GetMemberRoleActionInput
): Promise<MemberRole | null> {
  const actorId = await requireAuthenticatedActorId();
  const repository = await getServerProjectMembersRepository();

  return repository.getMemberRole({
    projectId: input.projectId,
    userId: actorId,
  });
}
