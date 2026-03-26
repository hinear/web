"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { sendProjectInvitationEmail } from "@/lib/email/send-project-invitation-email";
import { findUserIdByEmail } from "@/lib/notifications/find-user-id-by-email";
import { triggerProjectInvitedNotification } from "@/lib/notifications/triggers";
import { getRequestOrigin } from "@/lib/request-origin";
import {
  getAuthenticatedActorIdOrNull,
  getAuthenticatedUserOrNull,
} from "@/lib/supabase/server-auth";

function getInvitationActionNotice(action: "resend" | "revoke", email: string) {
  return action === "resend"
    ? `Invitation resent to ${email}.`
    : `Invitation revoked for ${email}.`;
}

function getInviterLabel(
  userId: string,
  user: {
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null
): string {
  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const name =
    typeof user?.user_metadata?.name === "string"
      ? user.user_metadata.name.trim()
      : "";
  const email = user?.email?.trim() ?? "";

  return fullName || name || email || userId;
}

export async function manageProjectInvitationAction(
  projectId: string,
  formData: FormData
) {
  const actorId = await getAuthenticatedActorIdOrNull();
  const user = await getAuthenticatedUserOrNull();

  if (!actorId) {
    return requireAuthRedirect(`/projects/${projectId}#project-access`);
  }

  const invitationId = String(formData.get("invitationId") ?? "");
  const invitationEmail = String(formData.get("invitationEmail") ?? "");
  const action = String(formData.get("invitationAction") ?? "");
  const repository = await getServerProjectsRepository();

  if (action === "resend") {
    const invitation = await repository.resendProjectInvitation(invitationId);
    const project = await repository.getProjectById(projectId);
    const origin = await getRequestOrigin();
    const invitedUserId = await findUserIdByEmail(invitation.email);
    const inviterLabel = getInviterLabel(actorId, user);
    const emailSent = await sendProjectInvitationEmail({
      expiresAt: invitation.expiresAt,
      inviteLink: `${origin}/invite/${invitation.token}`,
      invitedBy: inviterLabel,
      projectName: project?.name ?? "your project",
      to: invitation.email,
    });

    triggerProjectInvitedNotification({
      invitedBy: actorId,
      projectId,
      projectName: project?.name ?? "your project",
      role: invitation.role,
      targetUserIds: invitedUserId ? [invitedUserId] : [],
    }).catch((err) => {
      console.error(
        "[Notification] Failed to resend project invite push:",
        err
      );
    });

    if (!emailSent) {
      return redirect(
        `/projects/${projectId}?inviteNotice=${encodeURIComponent(
          `Invitation was refreshed for ${invitationEmail}, but Gmail SMTP is not configured. Share the invite link manually from the pending invitations list.`
        )}#project-access`
      );
    }
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
