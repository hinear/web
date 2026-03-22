import { type NextRequest, NextResponse } from "next/server";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getServiceProjectsRepository } from "@/features/projects/repositories/service-projects-repository";
import { getAuthenticatedUserOrNull } from "@/lib/supabase/server-auth";

function buildUrl(request: NextRequest, path: string) {
  return new URL(path, request.url);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const user = await getAuthenticatedUserOrNull();

  if (!user) {
    return requireAuthRedirect(`/invite/${token}/accept`);
  }

  const repository = getServiceProjectsRepository();
  const invitation = await repository.getProjectInvitationByToken(token);

  if (!invitation) {
    return NextResponse.redirect(
      buildUrl(
        request,
        `/invite/${token}?error=${encodeURIComponent("Invitation not found.")}`
      )
    );
  }

  if ((user.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.redirect(
      buildUrl(
        request,
        `/invite/${token}?error=${encodeURIComponent("Sign in with the invited email address to accept this invitation.")}`
      )
    );
  }

  const acceptedInvitation = await repository.acceptProjectInvitation(
    token,
    user.id
  );

  return NextResponse.redirect(
    buildUrl(
      request,
      `/projects/${acceptedInvitation.projectId}?inviteAccepted=1`
    )
  );
}
