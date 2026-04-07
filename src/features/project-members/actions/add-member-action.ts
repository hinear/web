"use server";

import { revalidatePath } from "next/cache";
import type { AddMemberActionInput } from "@/features/project-members/contracts";
import { canAddMember } from "@/features/project-members/lib/access-control";
import { assertValidAddMemberInput } from "@/features/project-members/lib/membership-validation";
import { getServerProjectMembersRepository } from "@/features/project-members/repositories/server-project-members-repository";
import type { ProjectMember } from "@/features/project-members/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function addMemberAction(
  input: AddMemberActionInput
): Promise<ProjectMember> {
  const actorId = await requireAuthenticatedActorId();

  assertValidAddMemberInput(input);

  const repository = await getServerProjectMembersRepository();

  // Check if actor has permission
  const actorRole = await repository.getMemberRole({
    projectId: input.projectId,
    userId: actorId,
  });

  if (!actorRole) {
    throw new Error("프로젝트에 속해 있지 않습니다.");
  }

  const accessCheck = canAddMember(actorRole);
  if (!accessCheck.allowed) {
    throw new Error(accessCheck.reason);
  }

  // Add member
  const member = await repository.addMember({
    ...input,
    addedBy: actorId,
  });

  // Revalidate project pages
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/projects", "layout");

  return member;
}
