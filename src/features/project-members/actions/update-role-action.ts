"use server";

import { revalidatePath } from "next/cache";
import type { UpdateRoleInput } from "@/features/project-members/contracts";
import { canUpdateMemberRole } from "@/features/project-members/lib/access-control";
import { assertValidUpdateRoleInput } from "@/features/project-members/lib/membership-validation";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import type { ProjectMember } from "@/features/project-members/types";
import { createClient } from "@/lib/supabase/server-client";

export async function updateRoleAction(
  input: UpdateRoleInput
): Promise<ProjectMember> {
  // Validate input
  assertValidUpdateRoleInput(input);

  const supabase = await createClient();
  const repository = new SupabaseProjectMembersRepository(supabase);

  // Check if actor has permission
  const actorRole = await repository.getMemberRole({
    projectId: input.projectId,
    userId: input.updatedBy,
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
  const member = await repository.updateRole(input);

  // Revalidate project pages
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/projects", "layout");

  return member;
}
