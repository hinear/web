"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getInviteProjectMemberErrorMessage } from "@/features/projects/lib/invite-project-member-error-message";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { sendProjectInvitationEmail } from "@/lib/email/send-project-invitation-email";
import { findUserIdByEmail } from "@/lib/notifications/find-user-id-by-email";
import { triggerProjectInvitedNotification } from "@/lib/notifications/triggers";
import { getRequestOrigin } from "@/lib/request-origin";
import {
  getAuthenticatedActorIdOrNull,
  getAuthenticatedUserOrNull,
} from "@/lib/supabase/server-auth";

function readInviteEmail(formData: FormData): string {
  return String(formData.get("inviteEmail") ?? "").trim();
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

export async function inviteProjectMemberAction(
  projectId: string,
  formData: FormData
) {
  const actorId = await getAuthenticatedActorIdOrNull();
  const user = await getAuthenticatedUserOrNull();

  if (!actorId) {
    return requireAuthRedirect(`/projects/${projectId}#project-access`);
  }

  const inviteEmail = readInviteEmail(formData);

  try {
    const repository = await getServerProjectsRepository();
    const invitation = await repository.inviteProjectMember({
      email: inviteEmail,
      invitedBy: actorId,
      projectId,
    });
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
      console.error("[Notification] Failed to send project invite push:", err);
    });

    if (!emailSent) {
      return redirect(
        `/projects/${projectId}?inviteNotice=${encodeURIComponent(
          `Invitation created for ${inviteEmail}, but Gmail SMTP is not configured. Share the invite link manually from the pending invitations list.`
        )}#project-access`
      );
    }

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
