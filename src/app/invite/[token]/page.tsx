import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceProjectsRepository } from "@/features/projects/repositories/service-projects-repository";
import { InvitationAcceptCard } from "@/features/projects/shared/components/invitation-accept-card";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

function getTokenPrefix(token: string) {
  return token.slice(0, 8);
}

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const { token } = await params;
  const query = await searchParams;
  const tokenPrefix = getTokenPrefix(token);
  const repository = await getServiceProjectsRepository();
  const invitation = await repository.getProjectInvitationByToken(token);

  if (!invitation) {
    console.warn("[invite/page] invitation lookup returned no rows", {
      tokenPrefix,
    });
    notFound();
  }

  console.info("[invite/page] invitation resolved", {
    email: invitation.email,
    projectId: invitation.projectId,
    status: invitation.status,
    tokenPrefix,
  });

  // Service-role required: invite page is accessed by unauthenticated users.
  // The invite token itself serves as the access control mechanism.
  const serviceSupabase = createServiceRoleSupabaseClient();
  const [{ data: project }, { data: inviterProfile }] = await Promise.all([
    serviceSupabase
      .from("projects")
      .select("id, name, type")
      .eq("id", invitation.projectId)
      .maybeSingle(),
    serviceSupabase
      .from("profiles")
      .select("display_name")
      .eq("id", invitation.invitedBy)
      .maybeSingle(),
  ]);

  if (!project) {
    console.warn(
      "[invite/page] project lookup failed after invitation lookup",
      {
        invitationId: invitation.id,
        projectId: invitation.projectId,
        tokenPrefix,
      }
    );
    notFound();
  }

  const inviterName =
    inviterProfile?.display_name?.trim() || invitation.invitedBy;
  console.info("[invite/page] rendering invitation page", {
    invitedBy: inviterName,
    projectId: project.id,
    projectName: project.name,
    queryError: query.error ?? null,
    status: invitation.status,
    tokenPrefix,
  });
  const noticeMessage =
    invitation.status === "accepted"
      ? "This invitation was already accepted. You can open the project directly."
      : invitation.status === "expired"
        ? "This invitation expired before it was accepted."
        : invitation.status === "revoked"
          ? "This invitation was revoked by the project owner."
          : query.error;
  const acceptHref =
    invitation.status === "accepted"
      ? `/projects/${project.id}`
      : `/invite/${token}/accept`;

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] items-center px-4 py-10">
      <div className="flex w-full flex-col gap-4">
        {query.error && invitation.status === "pending" ? (
          <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] leading-5 font-medium text-[#B91C1C]">
            {query.error}
          </div>
        ) : null}
        <InvitationAcceptCard
          acceptHref={acceptHref}
          declineHref="/"
          expiresAt={new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(new Date(invitation.expiresAt))}
          invitedBy={inviterName}
          noticeMessage={noticeMessage}
          projectName={project.name}
          projectType={project.type}
          status={invitation.status}
        />
        {invitation.status === "accepted" ? (
          <Link
            className="text-center text-[13px] font-medium text-[#6B7280]"
            href={`/projects/${project.id}`}
          >
            Open project details
          </Link>
        ) : null}
      </div>
    </main>
  );
}
