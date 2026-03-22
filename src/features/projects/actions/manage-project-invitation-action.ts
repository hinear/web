"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

function getInvitationActionNotice(action: "resend" | "revoke", email: string) {
  return action === "resend"
    ? `Invitation resent to ${email}.`
    : `Invitation revoked for ${email}.`;
}

export async function manageProjectInvitationAction(
  projectId: string,
  formData: FormData
) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect(`/projects/${projectId}#project-access`);
  }

  const invitationId = String(formData.get("invitationId") ?? "");
  const invitationEmail = String(formData.get("invitationEmail") ?? "");
  const action = String(formData.get("invitationAction") ?? "");
  const repository = await getServerProjectsRepository();

  if (action === "resend") {
    await repository.resendProjectInvitation(invitationId);
  } else if (action === "revoke") {
    await repository.revokeProjectInvitation(invitationId);
  } else {
    return redirect(
      `/projects/${projectId}?inviteError=${encodeURIComponent("Unknown invitation action.")}#project-access`
    );
  }

  return redirect(
    `/projects/${projectId}?inviteNotice=${encodeURIComponent(
      getInvitationActionNotice(action, invitationEmail)
    )}#project-access`
  );
}
