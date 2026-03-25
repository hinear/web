"use server";

import { revalidatePath } from "next/cache";
import { SupabaseProjectMembersRepository } from "@/features/project-members/repositories/SupabaseProjectMembersRepository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function transferOwnershipAction(
  projectId: string,
  newOwnerId: string,
  currentOwnerId: string
): Promise<void> {
  const supabase = await createRequestSupabaseServerClient();
  const membersRepo = new SupabaseProjectMembersRepository(supabase);

  // Check if current user is owner
  const currentRole = await membersRepo.getMemberRole({
    projectId,
    userId: currentOwnerId,
  });

  if (currentRole !== "owner") {
    throw new Error("프로젝트 소유자만 소유권을 이전할 수 있습니다.");
  }

  // Check if new owner is a member
  const newMemberRole = await membersRepo.getMemberRole({
    projectId,
    userId: newOwnerId,
  });

  if (!newMemberRole) {
    throw new Error("새 소유자가 프로젝트의 멤버가 아닙니다.");
  }

  // Update current owner to member
  await membersRepo.updateRole({
    projectId,
    userId: currentOwnerId,
    role: "member",
    updatedBy: currentOwnerId,
  });

  // Update new member to owner
  await membersRepo.updateRole({
    projectId,
    userId: newOwnerId,
    role: "owner",
    updatedBy: currentOwnerId,
  });

  // Revalidate project pages
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects", "layout");
}
