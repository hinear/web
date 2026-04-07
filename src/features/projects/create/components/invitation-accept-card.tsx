"use client";

import Link from "next/link";

import type {
  ProjectInvitationStatus,
  ProjectType,
} from "@/features/projects/types";

import {
  formatInvitationStatus,
  formatProjectTypeLabel,
} from "../lib/operation-card-utils";

interface InvitationAcceptCardProps {
  acceptLabel?: string;
  projectName: string;
  projectType: ProjectType;
  invitedBy: string;
  expiresAt: string;
  declineHref?: string;
  noticeMessage?: string;
  acceptHref?: string;
  status?: ProjectInvitationStatus;
}

export function InvitationAcceptCard({
  acceptLabel,
  projectName,
  projectType,
  invitedBy,
  expiresAt,
  declineHref = "/",
  noticeMessage,
  acceptHref = "/projects/new",
  status = "pending",
}: InvitationAcceptCardProps) {
  const description =
    status === "accepted"
      ? `You already joined this ${projectType} project. Open it to continue working on shared issues.`
      : status === "expired"
        ? `This invitation has expired. Ask ${invitedBy} to send a fresh invite before trying again.`
        : status === "revoked"
          ? `This invitation is no longer active. Contact ${invitedBy} if you still need access.`
          : `${invitedBy} invited you to join this ${projectType} project. Accept to collaborate on issues, comments, and shared ownership.`;

  const benefitTitle =
    status === "accepted"
      ? "Project access is ready"
      : status === "pending"
        ? "What you get"
        : "Invitation status";
  const benefitCopy =
    status === "accepted"
      ? "Open the project board to review issues, comments, and member activity."
      : status === "expired"
        ? "Expired invitations cannot be accepted. Return to the sender and request a new one."
        : status === "revoked"
          ? "Revoked invitations stay visible for context, but they no longer grant project access."
          : "After acceptance, redirect to the project board. If you are not signed in, require auth first and return here.";
  const resolvedAcceptLabel =
    acceptLabel ??
    (status === "accepted"
      ? "Open project"
      : status === "pending"
        ? "Accept invitation"
        : "Back to home");
  const resolvedAcceptHref =
    status === "accepted"
      ? acceptHref
      : status === "pending"
        ? acceptHref
        : "/";

  return (
    <section className="rounded-[28px] border border-[#E6E8EC] bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4">
        <span className="text-[12px] font-semibold text-[#5E6AD2]">
          Invitation
        </span>
        <h2 className="font-display text-[30px] font-bold text-[#111318]">
          Join {projectName} project
        </h2>
        <p className="text-[14px] font-medium leading-6 text-[#4B5563]">
          {description}
        </p>

        <div className="rounded-[18px] border border-[#E6E8EC] bg-[#FCFCFD] p-[18px]">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px] font-semibold text-[#111318]">
            <dt>Project</dt>
            <dd>{projectName}</dd>
            <dt>Type</dt>
            <dd>{formatProjectTypeLabel(projectType)}</dd>
            <dt>Invited by</dt>
            <dd>{invitedBy}</dd>
            <dt>Expires</dt>
            <dd>{expiresAt}</dd>
            <dt>Status</dt>
            <dd>{formatInvitationStatus(status)}</dd>
          </dl>
        </div>

        <div className="rounded-[16px] border border-[#A5B4FC] bg-[#EEF2FF] p-4">
          <h3 className="text-[15px] font-bold text-[#4338CA]">
            {benefitTitle}
          </h3>
          <p className="mt-2 text-[13px] font-medium leading-5 text-[#4338CA]">
            {benefitCopy}
          </p>
        </div>

        {noticeMessage ? (
          <div className="rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13px] leading-5 font-medium text-[#1D4ED8]">
            {noticeMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[#E6E8EC] bg-white px-4 text-[14px] font-bold text-[#111318]"
            href={declineHref}
          >
            Decline
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#5E6AD2] px-4 text-[14px] font-bold text-white"
            href={resolvedAcceptHref}
          >
            {resolvedAcceptLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
