"use server";

import type { CheckAccessActionInput } from "@/features/project-members/contracts";
import { getServerProjectMembersRepository } from "@/features/project-members/repositories/server-project-members-repository";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function checkAccessAction(
  input: CheckAccessActionInput
): Promise<boolean> {
  const actorId = await requireAuthenticatedActorId();
  const repository = await getServerProjectMembersRepository();

  return repository.hasProjectPermission(
    input.projectId,
    actorId,
    input.permission
  );
}
