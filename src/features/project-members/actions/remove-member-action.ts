"use server";

import { revalidatePath } from "next/cache";
import type { RemoveMemberActionInput } from "@/features/project-members/contracts";
import { canRemoveMember } from "@/features/project-members/lib/access-control";
import { assertValidRemoveMemberInput } from "@/features/project-members/lib/membership-validation";
import { getServerProjectMembersRepository } from "@/features/project-members/repositories/server-project-members-repository";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function removeMemberAction(
  input: RemoveMemberActionInput
): Promise<void> {
  const actorId = await requireAuthenticatedActorId();

  assertValidRemoveMemberInput(input);

  const repository = await getServerProjectMembersRepository();

  // Check if actor has permission
  const actorRole = await repository.getMemberRole({
    projectId: input.projectId,
    userId: actorId,
  });

  if (!actorRole) {
    throw new Error("프로젝트에 속해 있지 않습니다.");
  }

  // Get target member role
  const targetMember = await repository.getMemberById(
    input.projectId,
    input.userId
  );

  if (!targetMember) {
    throw new Error("멤버를 찾을 수 없습니다.");
  }

  // Check if last owner
  const isLastOwner = await repository.isLastOwner(input.projectId);

  const accessCheck = canRemoveMember(
    actorRole,
    targetMember.role,
    isLastOwner
  );
  if (!accessCheck.allowed) {
    throw new Error(accessCheck.reason);
  }

  // Remove member
  await repository.removeMember({
    projectId: input.projectId,
    userId: input.userId,
    removedBy: actorId,
  });

  // Revalidate project pages
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/projects", "layout");
}
