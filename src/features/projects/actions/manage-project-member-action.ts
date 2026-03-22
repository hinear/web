"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

function buildProjectAccessRedirect(
  projectId: string,
  params: Record<string, string>
) {
  const search = new URLSearchParams(params);
  return `/projects/${projectId}?${search.toString()}#project-access`;
}

export async function manageProjectMemberAction(
  projectId: string,
  formData: FormData
) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect(`/projects/${projectId}#project-access`);
  }

  const memberId = String(formData.get("memberId") ?? "");
  const memberName = String(formData.get("memberName") ?? "");

  if (!memberId) {
    return redirect(
      buildProjectAccessRedirect(projectId, {
        inviteError: "Unknown member.",
      })
    );
  }

  const repository = await getServerProjectsRepository();
  const members = await repository.listProjectMembers(projectId);
  const actorMembership = members.find((member) => member.id === actorId);
  const targetMembership = members.find((member) => member.id === memberId);

  if (!actorMembership || actorMembership.role !== "owner") {
    return redirect(
      buildProjectAccessRedirect(projectId, {
        inviteError: "Only project owners can remove members.",
      })
    );
  }

  if (!targetMembership) {
    return redirect(
      buildProjectAccessRedirect(projectId, {
        inviteError: "That member is no longer part of this project.",
      })
    );
  }

  if (targetMembership.id === actorId || !targetMembership.canRemove) {
    return redirect(
      buildProjectAccessRedirect(projectId, {
        inviteError: "Owners cannot remove themselves from the project.",
      })
    );
  }

  await repository.removeProjectMember(projectId, memberId);

  return redirect(
    buildProjectAccessRedirect(projectId, {
      inviteNotice: `${memberName || targetMembership.name} was removed from the project.`,
    })
  );
}
