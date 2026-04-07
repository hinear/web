"use server";

import { revalidatePath } from "next/cache";
import type { UpdateRoleActionInput } from "@/features/project-members/contracts";
import { canUpdateMemberRole } from "@/features/project-members/lib/access-control";
import { assertValidUpdateRoleInput } from "@/features/project-members/lib/membership-validation";
import { getServerProjectMembersRepository } from "@/features/project-members/repositories/server-project-members-repository";
import type { ProjectMember } from "@/features/project-members/types";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function updateRoleAction(
  input: UpdateRoleActionInput
): Promise<ProjectMember> {
  const actorId = await requireAuthenticatedActorId();

  assertValidUpdateRoleInput(input);

  const repository = await getServerProjectMembersRepository();

  // Check if actor has permission
  const actorRole = await repository.getMemberRole({
    projectId: input.projectId,
    userId: actorId,
  });

  if (!actorRole) {
    throw new Error("프로젝트에 속해 있지 않습니다.");
  }

  // Get current role of target member
  const currentMember = await repository.getMemberById(
    input.projectId,
    input.userId
  );

  if (!currentMember) {
    throw new Error("멤버를 찾을 수 없습니다.");
  }

  // Check if last owner
  const isLastOwner = await repository.isLastOwner(input.projectId);

  const accessCheck = canUpdateMemberRole(
    actorRole,
    currentMember.role,
    input.role,
    isLastOwner
  );

  if (!accessCheck.allowed) {
    throw new Error(accessCheck.reason);
  }

  // Update role
  const member = await repository.updateRole({
    ...input,
    updatedBy: actorId,
  });

  // Revalidate project pages
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/projects", "layout");

  return member;
}
