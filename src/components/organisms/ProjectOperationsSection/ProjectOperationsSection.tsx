import type * as React from "react";

import {
  InvitationAcceptCard,
  ProjectAccessCard,
} from "@/features/projects/components/project-operation-cards";
import type {
  ProjectInvitationStatus,
  ProjectInvitationSummary,
  ProjectMemberSummary,
  ProjectType,
} from "@/features/projects/types";
import { cn } from "@/lib/utils";

export interface ProjectOperationsSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  acceptHref?: string;
  declineHref?: string;
  expiresAt?: string;
  inviteAction?: (formData: FormData) => void | Promise<void>;
  invitationAction?: (formData: FormData) => void | Promise<void>;
  memberAction?: (formData: FormData) => void | Promise<void>;
  inviteErrorMessage?: string;
  inviteValue?: string;
  inviteNoticeMessage?: string;
  invitations?: ProjectInvitationSummary[];
  invitedBy?: string;
  invitationStatus?: ProjectInvitationStatus;
  members?: ProjectMemberSummary[];
  projectName?: string;
  projectType?: ProjectType;
}

export function ProjectOperationsSection({
  acceptHref = "/projects/new",
  className,
  declineHref = "/",
  expiresAt = "Mar 27, 2026",
  inviteAction,
  invitationAction,
  memberAction,
  inviteErrorMessage,
  inviteValue = "teammate@hinear.app",
  inviteNoticeMessage,
  invitations,
  invitedBy = "Alex Kim",
  invitationStatus = "pending",
  members,
  projectName = "Hinear",
  projectType = "team",
  ...props
}: ProjectOperationsSectionProps) {
  const primaryInvitation = invitations?.[0];

  return (
    <section
      className={cn(
        "flex w-full flex-col gap-6 rounded-[28px] border border-[var(--app-color-border-muted,#E6E8EC)] bg-[#FAFBFD] p-8",
        className
      )}
      {...props}
    >
      <h2 className="font-display text-[26px] leading-[1.1] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
        Project Access & Invitations
      </h2>

      <div
        className="grid gap-6 xl:grid-cols-[920px_560px]"
        id="project-access"
      >
        <ProjectAccessCard
          action={inviteAction}
          invitationAction={invitationAction}
          memberAction={memberAction}
          errorMessage={inviteErrorMessage}
          inviteValue={inviteValue}
          invitations={invitations}
          members={members}
          noticeMessage={inviteNoticeMessage}
        />
        <InvitationAcceptCard
          acceptHref={
            primaryInvitation
              ? `/invite/${primaryInvitation.token}`
              : acceptHref
          }
          declineHref={declineHref}
          expiresAt={
            primaryInvitation
              ? new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(new Date(primaryInvitation.expiresAt))
              : expiresAt
          }
          invitedBy={primaryInvitation?.invitedBy ?? invitedBy}
          noticeMessage={
            primaryInvitation
              ? `A pending invitation is live for ${primaryInvitation.email}.`
              : undefined
          }
          projectName={projectName}
          projectType={projectType}
          status={primaryInvitation?.status ?? invitationStatus}
        />
      </div>
    </section>
  );
}
