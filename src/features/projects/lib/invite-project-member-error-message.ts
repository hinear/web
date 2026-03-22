import { isRepositoryError } from "@/features/issues/lib/repository-errors";

export function getInviteProjectMemberErrorMessage(error: unknown): string {
  if (isRepositoryError(error)) {
    if (error.code === "PROJECT_INVITATION_EXISTS") {
      return "A pending invitation already exists for this email. Resend or wait for it to be accepted.";
    }

    if (error.code === "AUTH_REQUIRED") {
      return "Your session expired. Sign in again and retry the invite.";
    }

    if (error.code === "FORBIDDEN") {
      return "Only project owners can send invitations.";
    }
  }

  return "We couldn't send the invitation. Check the email and try again.";
}
