"use server";

import { revalidatePath } from "next/cache";
import { canRemoveMember } from "@/features/project-members/lib/access-control";
import { assertValidRemoveMemberInput } from "@/features/project-members/lib/membership-validation";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function removeMemberAction(
  projectId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  // Validate input
  assertValidRemoveMemberInput(projectId, userId, removedBy);

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseProjectMembersRepository(supabase);

  // Check if actor has permission
  const actorRole = await repository.getMemberRole({
    projectId,
    userId: removedBy,
  });

  if (!actorRole) {
    throw new Error("프로젝트에 속해 있지 않습니다.");
  }

  // Get target member role
  const targetMember = await repository.getMemberById(projectId, userId);

  if (!targetMember) {
    throw new Error("멤버를 찾을 수 없습니다.");
  }

  // Check if last owner
  const isLastOwner = await repository.isLastOwner(projectId);

  const accessCheck = canRemoveMember(
    actorRole,
    targetMember.role,
    isLastOwner
  );
  if (!accessCheck.allowed) {
    throw new Error(accessCheck.reason);
  }

  // Remove member
  await repository.removeMember({ projectId, userId, removedBy });

  // Revalidate project pages
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects", "layout");
}
