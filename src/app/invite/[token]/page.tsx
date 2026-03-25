import Link from "next/link";
import { notFound } from "next/navigation";

import { InvitationAcceptCard } from "@/features/projects/components/project-operation-cards";
import { getServiceProjectsRepository } from "@/features/projects/repositories/service-projects-repository";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const { token } = await params;
  const query = await searchParams;
  const repository = await getServiceProjectsRepository();
  const invitation = await repository.getProjectInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const project = await repository.getProjectById(invitation.projectId);

  if (!project) {
    notFound();
  }

  const inviter = (await repository.listProjectMembers(project.id)).find(
    (member) => member.id === invitation.invitedBy
  );
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
          invitedBy={inviter?.name ?? invitation.invitedBy}
          noticeMessage={noticeMessage}
          projectName={project.name}
          projectType={project.type}
          status={invitation.status}
        />
        <Link
          className="text-center text-[13px] font-medium text-[#6B7280]"
          href={`/projects/${project.id}`}
        >
          Open project details
        </Link>
      </div>
    </main>
  );
}
