"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getInviteProjectMemberErrorMessage } from "@/features/projects/lib/invite-project-member-error-message";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

function readInviteEmail(formData: FormData): string {
  return String(formData.get("inviteEmail") ?? "").trim();
}

export async function inviteProjectMemberAction(
  projectId: string,
  formData: FormData
) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect(`/projects/${projectId}#project-access`);
  }

  const inviteEmail = readInviteEmail(formData);

  try {
    await (await getServerProjectsRepository()).inviteProjectMember({
      email: inviteEmail,
      invitedBy: actorId,
      projectId,
    });

    return redirect(
      `/projects/${projectId}?inviteSent=1&inviteEmail=${encodeURIComponent(inviteEmail)}#project-access`
    );
  } catch (error) {
    const params = new URLSearchParams({
      inviteEmail,
      inviteError: getInviteProjectMemberErrorMessage(error),
    });

    return redirect(
      `/projects/${projectId}?${params.toString()}#project-access`
    );
  }
}
