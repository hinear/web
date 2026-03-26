import { type NextRequest, NextResponse } from "next/server";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getServiceProjectsRepository } from "@/features/projects/repositories/service-projects-repository";
import { getAuthenticatedUserOrNull } from "@/lib/supabase/server-auth";

function buildUrl(request: NextRequest, path: string) {
  return new URL(path, request.url);
}

function getTokenPrefix(token: string) {
  return token.slice(0, 8);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tokenPrefix = getTokenPrefix(token);
  const user = await getAuthenticatedUserOrNull();

  if (!user) {
    console.info("[invite/accept] redirecting unauthenticated user", {
      tokenPrefix,
    });
    return requireAuthRedirect(`/invite/${token}/accept`);
  }

  const repository = await getServiceProjectsRepository();
  const invitation = await repository.getProjectInvitationByToken(token);

  if (!invitation) {
    console.warn("[invite/accept] invitation lookup returned no rows", {
      tokenPrefix,
      userId: user.id,
    });
    return NextResponse.redirect(
      buildUrl(
        request,
        `/invite/${token}?error=${encodeURIComponent("Invitation not found.")}`
      )
    );
  }

  if ((user.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
    console.warn("[invite/accept] invited email mismatch", {
      invitedEmail: invitation.email,
      tokenPrefix,
      userEmail: user.email ?? null,
      userId: user.id,
    });
    return NextResponse.redirect(
      buildUrl(
        request,
        `/invite/${token}?error=${encodeURIComponent("Sign in with the invited email address to accept this invitation.")}`
      )
    );
  }

  console.info("[invite/accept] accepting invitation", {
    invitationId: invitation.id,
    projectId: invitation.projectId,
    tokenPrefix,
    userId: user.id,
  });
  const acceptedInvitation = await repository.acceptProjectInvitation(
    token,
    user.id
  );

  console.info("[invite/accept] invitation accepted", {
    invitationId: acceptedInvitation.id,
    projectId: acceptedInvitation.projectId,
    status: acceptedInvitation.status,
    tokenPrefix,
    userId: user.id,
  });
  return NextResponse.redirect(
    buildUrl(
      request,
      `/projects/${acceptedInvitation.projectId}?inviteAccepted=1`
    )
  );
}
