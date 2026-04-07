"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import type {
  ProjectInvitationSummary,
  ProjectMemberSummary,
  ProjectType,
} from "@/features/projects/types";

import {
  defaultMembers,
  formatInvitationMeta,
  formatInvitationStatus,
} from "../lib/operation-card-utils";

interface ProjectAccessCardProps {
  action?: (formData: FormData) => void | Promise<void>;
  invitationAction?: (formData: FormData) => void | Promise<void>;
  memberAction?: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  inviteValue?: string;
  noticeMessage?: string;
  invitations?: ProjectInvitationSummary[];
  members?: ProjectMemberSummary[];
  projectType?: ProjectType;
  sectionId?: string;
}

function InviteMemberSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full justify-center md:w-auto"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Sending invite..." : "Send invite"}
    </Button>
  );
}

function InvitationActionButton({
  disabled,
  pendingLabel,
  readyLabel,
  variant,
}: {
  disabled: boolean;
  pendingLabel: string;
  readyLabel: string;
  variant: "ghost" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={disabled || pending}
      size="sm"
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : readyLabel}
    </Button>
  );
}

function MemberActionButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={disabled || pending}
      size="sm"
      type="submit"
      variant="ghost"
    >
      {pending ? "Removing..." : "Remove"}
    </Button>
  );
}

export function ProjectAccessCard({
  action,
  invitationAction,
  memberAction,
  errorMessage,
  inviteValue = "teammate@hinear.app",
  invitations = [],
  noticeMessage,
  members = defaultMembers,
  projectType = "team",
  sectionId = "project-settings-access",
}: ProjectAccessCardProps) {
  const [memberQuery, setMemberQuery] = useState("");
  const currentMember = members.find((member) => member.isCurrentUser);
  const canManageAccess = currentMember ? currentMember.role === "owner" : true;
  const canInviteMembers = projectType === "team" && canManageAccess;
  const normalizedMemberQuery = memberQuery.trim().toLowerCase();

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        if (!normalizedMemberQuery) {
          return true;
        }

        return [member.name, member.id, member.note, member.role]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedMemberQuery));
      }),
    [members, normalizedMemberQuery]
  );

  const filteredInvitations = useMemo(
    () =>
      invitations.filter((invitation) => {
        if (!normalizedMemberQuery) {
          return true;
        }

        return [invitation.email, invitation.invitedBy]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedMemberQuery));
      }),
    [invitations, normalizedMemberQuery]
  );

  return (
    <section
      className="scroll-mt-24 rounded-[18px] border border-[#E6E8EC] bg-white p-6"
      id={sectionId}
    >
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <h2 className="text-[18px] font-bold text-[#111318]">Access</h2>
          <p className="text-[12px] font-medium leading-5 text-[#6B7280]">
            Invite teammates from settings and keep the current member list
            visible in the same place.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-[16px] border border-[#C7D2FE] bg-[#FCFCFF] p-[18px]">
          <h3 className="text-[16px] font-bold text-[#111318]">
            Invite member
          </h3>
          {noticeMessage ? (
            <div className="rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13px] leading-5 font-medium text-[#1D4ED8]">
              {noticeMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] leading-5 font-medium text-[#B91C1C]">
              {errorMessage}
            </div>
          ) : null}
          <form action={action} className="flex flex-col gap-3">
            <Field
              aria-invalid={errorMessage ? true : undefined}
              aria-label="Invite member"
              defaultValue={inviteValue}
              disabled={!canInviteMembers}
              name="inviteEmail"
              type="email"
            />
            <p className="text-[11px] font-medium leading-5 text-[#6B7280]">
              {projectType === "personal"
                ? "Personal projects do not support invitations. Switch this project to team before inviting members."
                : canManageAccess
                  ? "Only owners can send invites. Duplicate pending invitations should show resend guidance instead of creating another row."
                  : "Only project owners can send invites or change access. You can still review the current roster."}
            </p>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <Link
                className="text-[12px] font-semibold text-[#5E6AD2]"
                href="#pending-invitations"
              >
                View pending invitations
              </Link>
              <InviteMemberSubmitButton disabled={!canInviteMembers} />
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-3" id="pending-invitations">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-bold text-[#111318]">
              Pending invitations ({invitations.length})
            </h3>
            <span className="text-[11px] font-medium text-[#6B7280]">
              Owner-only visibility
            </span>
          </div>
          {!canManageAccess ? (
            <div className="rounded-[14px] border border-dashed border-[#D6DAE1] bg-[#FCFCFD] p-4 text-[12px] font-medium text-[#6B7280]">
              Pending invitation controls are limited to project owners.
            </div>
          ) : filteredInvitations.length > 0 ? (
            filteredInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-[14px] border border-[#D6DAE1] bg-white p-[14px] md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    alt={invitation.invitedBy}
                    fallback={invitation.invitedBy}
                    name={invitation.invitedBy}
                    size={36}
                    src={invitation.invitedByAvatarUrl}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="text-[14px] font-semibold text-[#111318]">
                      {invitation.email}
                    </div>
                    <div className="text-[12px] font-medium text-[#6B7280]">
                      Invited by {invitation.invitedBy} on{" "}
                      {formatInvitationMeta(invitation.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <span className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#C7D2FE] bg-[#EEF2FF] px-3 text-[12px] font-bold text-[#4338CA]">
                    {formatInvitationStatus(invitation.status)}
                  </span>
                  <span className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] font-semibold text-[#6B7280]">
                    Expires {formatInvitationMeta(invitation.expiresAt)}
                  </span>
                  <form action={invitationAction}>
                    <input
                      name="invitationId"
                      readOnly
                      type="hidden"
                      value={invitation.id}
                    />
                    <input
                      name="invitationEmail"
                      readOnly
                      type="hidden"
                      value={invitation.email}
                    />
                    <input
                      name="invitationAction"
                      readOnly
                      type="hidden"
                      value="resend"
                    />
                    <InvitationActionButton
                      disabled={!invitationAction}
                      pendingLabel="Resending..."
                      readyLabel="Resend"
                      variant="secondary"
                    />
                  </form>
                  <form action={invitationAction}>
                    <input
                      name="invitationId"
                      readOnly
                      type="hidden"
                      value={invitation.id}
                    />
                    <input
                      name="invitationEmail"
                      readOnly
                      type="hidden"
                      value={invitation.email}
                    />
                    <input
                      name="invitationAction"
                      readOnly
                      type="hidden"
                      value="revoke"
                    />
                    <InvitationActionButton
                      disabled={!invitationAction}
                      pendingLabel="Revoking..."
                      readyLabel="Revoke"
                      variant="ghost"
                    />
                  </form>
                </div>
              </div>
            ))
          ) : invitations.length > 0 && normalizedMemberQuery ? (
            <div className="rounded-[14px] border border-dashed border-[#D6DAE1] bg-[#FCFCFD] p-4 text-[12px] font-medium text-[#6B7280]">
              No invitations match &ldquo;{memberQuery.trim()}&rdquo;.
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-[#D6DAE1] bg-[#FCFCFD] p-4 text-[12px] font-medium text-[#6B7280]">
              No pending invitations yet.
            </div>
          )}
        </div>

        <div
          className="scroll-mt-24 flex flex-col gap-3"
          id="project-settings-members"
        >
          <h3 className="text-[16px] font-bold text-[#111318]">
            Current team ({members.length})
          </h3>
          <Field
            aria-label="Search members"
            onChange={(event) => setMemberQuery(event.currentTarget.value)}
            placeholder="Search members by name or email"
            value={memberQuery}
          />
          <p className="text-[11px] font-medium leading-5 text-[#6B7280]">
            Owners can remove members. Members can view the roster but cannot
            change access.
          </p>

          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-[14px] border border-[#D6DAE1] bg-white p-[14px] md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    alt={member.name}
                    fallback={member.id}
                    name={member.name}
                    size={36}
                    src={member.avatarUrl}
                  />
                  <div className="text-[14px] font-semibold text-[#111318]">
                    {member.name}{" "}
                    <span className="font-medium text-[#6B7280]">
                      {member.role}
                    </span>{" "}
                    <span className="font-medium text-[#111318]">
                      {member.isCurrentUser ? "You" : member.note}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <span
                    className={[
                      "inline-flex min-h-10 items-center justify-center rounded-[10px] border px-3 text-[12px] font-bold",
                      member.role === "owner"
                        ? "border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]"
                        : "border-[#D6DAE1] bg-white text-[#111318]",
                    ].join(" ")}
                  >
                    {member.role}
                  </span>
                  {canManageAccess && member.canRemove ? (
                    <form action={memberAction}>
                      <input
                        name="memberId"
                        readOnly
                        type="hidden"
                        value={member.id}
                      />
                      <input
                        name="memberName"
                        readOnly
                        type="hidden"
                        value={member.name}
                      />
                      <MemberActionButton disabled={!memberAction} />
                    </form>
                  ) : member.canRemove ? (
                    <span className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] font-semibold text-[#9CA3AF]">
                      Owner only
                    </span>
                  ) : (
                    <span className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12px] font-semibold text-[#9CA3AF]">
                      Cannot remove self
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[14px] border border-dashed border-[#D6DAE1] bg-[#FCFCFD] p-4 text-[12px] font-medium text-[#6B7280]">
              No members match &ldquo;{memberQuery.trim()}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
