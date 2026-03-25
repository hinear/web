"use server";

import { revalidatePath } from "next/cache";
import type { AddMemberInput } from "@/features/project-members/contracts";
import { canAddMember } from "@/features/project-members/lib/access-control";
import { assertValidAddMemberInput } from "@/features/project-members/lib/membership-validation";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import type { ProjectMember } from "@/features/project-members/types";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function addMemberAction(
  input: AddMemberInput
): Promise<ProjectMember> {
  // Validate input
  assertValidAddMemberInput(input);

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseProjectMembersRepository(supabase);

  // Check if actor has permission
  const actorRole = await repository.getMemberRole({
    projectId: input.projectId,
    userId: input.addedBy,
  });

  if (!actorRole) {
    throw new Error("프로젝트에 속해 있지 않습니다.");
  }

  const accessCheck = canAddMember(actorRole);
  if (!accessCheck.allowed) {
    throw new Error(accessCheck.reason);
  }

  // Add member
  const member = await repository.addMember(input);

  // Revalidate project pages
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/projects", "layout");

  return member;
}
