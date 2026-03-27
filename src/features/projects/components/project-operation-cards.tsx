"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import type {
  ProjectInvitationStatus,
  ProjectInvitationSummary,
  ProjectMemberSummary,
  ProjectType,
} from "@/features/projects/types";

interface CreateProjectFormCardProps {
  action?: (formData: FormData) => void | Promise<void>;
  defaultType?: ProjectType;
  errorMessage?: string;
}

interface CreateProjectNextStepsCardProps {
  projectType?: ProjectType;
}

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
}

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

const defaultMembers: ProjectMemberSummary[] = [
  {
    id: "member-1",
    name: "Alex Kim",
    role: "owner",
    note: "You",
    isCurrentUser: true,
    canRemove: false,
  },
  {
    id: "member-2",
    name: "John Doe",
    role: "member",
    note: "Assigned 6 issues",
    canRemove: true,
  },
];

function formatInvitationMeta(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatProjectTypeLabel(value: ProjectType) {
  return value === "team" ? "Team" : "Personal";
}

function formatInvitationStatus(status: ProjectInvitationStatus) {
  if (status === "accepted") return "Accepted";
  if (status === "revoked") return "Revoked";
  if (status === "expired") return "Expired";
  return "Pending";
}

function ProjectTypeOption({
  description,
  title,
  value,
  checked,
  onChange,
}: {
  value: ProjectType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: ProjectType) => void;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer flex-col gap-2 rounded-[18px] border p-[18px] transition-colors",
        checked
          ? "border-[2px] border-[#818CF8] bg-[#EEF2FF]"
          : "border-[#CBD5E1] bg-white",
      ].join(" ")}
    >
      <input
        className="sr-only"
        checked={checked}
        onChange={() => onChange(value)}
        name="type"
        type="radio"
        value={value}
      />
      <span className="text-base font-bold text-[#111318]">{title}</span>
      <span
        className={
          checked
            ? "text-[13px] font-medium leading-5 text-[#4338CA]"
            : "text-[13px] font-medium leading-5 text-[#4B5563]"
        }
      >
        {description}
      </span>
    </label>
  );
}

export function CreateProjectFormCard({
  action,
  defaultType = "personal",
  errorMessage,
}: CreateProjectFormCardProps) {
  const [selectedType, setSelectedType] = useState<ProjectType>(defaultType);
  const content = (
    <>
      <h2 className="text-[18px] font-bold text-[#111318]">Project details</h2>

      {errorMessage ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] leading-5 font-medium text-[#B91C1C]">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="project-name"
          className="text-[13px] font-semibold text-[#111318]"
        >
          Project name
        </label>
        <Field
          className="h-auto min-h-[46px] rounded-[12px] border-[#E6E8EC] bg-[#FCFCFD] px-[14px] py-3 font-medium text-[#111318] placeholder:font-medium placeholder:text-[#8A90A2]"
          id="project-name"
          name="name"
          placeholder="Hinear Web App"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="project-key"
          className="text-[13px] font-semibold text-[#111318]"
        >
          Project key
        </label>
        <Field
          className="h-auto min-h-[46px] max-w-[180px] rounded-[12px] border-[#E6E8EC] bg-[#FCFCFD] px-[14px] py-3 font-bold text-[#111318] placeholder:font-medium placeholder:text-[#8A90A2]"
          id="project-key"
          name="key"
          placeholder="HIN"
          required
          aria-invalid={errorMessage ? true : undefined}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-semibold text-[#111318]">
          Project type
        </legend>
        <div
          aria-label="Project type"
          className="grid gap-3 md:grid-cols-2"
          role="radiogroup"
        >
          <ProjectTypeOption
            checked={selectedType === "personal"}
            description="Use this when you are working alone. Invitations stay hidden and settings remain simpler."
            onChange={setSelectedType}
            title="Personal"
            value="personal"
          />
          <ProjectTypeOption
            checked={selectedType === "team"}
            description="Use this when you want owners, members, invitations, and shared issue ownership from the start."
            onChange={setSelectedType}
            title="Team"
            value="team"
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[420px] text-[13px] font-medium leading-5 text-[#4B5563]">
          After creation, land on the board and continue with issue setup.
        </p>
        <Button
          className="min-h-[46px] w-full justify-center rounded-[12px] bg-[#5E6AD2] px-4 py-3 text-[14px] font-bold md:w-auto"
          type="submit"
        >
          Create project
        </Button>
      </div>
    </>
  );

  return (
    <section className="rounded-[24px] border border-[#E6E8EC] bg-white p-6">
      {action ? (
        <form action={action} className="flex flex-col gap-[18px]">
          {content}
        </form>
      ) : (
        <div className="flex flex-col gap-[18px]">{content}</div>
      )}
    </section>
  );
}

export function CreateProjectNextStepsCard({
  projectType = "team",
}: CreateProjectNextStepsCardProps) {
  return (
    <aside className="rounded-[24px] border border-[#E6E8EC] bg-white p-6">
      <h2 className="text-[18px] font-bold text-[#111318]">
        What happens next
      </h2>
      <ol className="mt-4 flex list-decimal flex-col gap-4 pl-5 text-[14px] font-semibold leading-6 text-[#111318]">
        <li>Redirect to the project board</li>
        <li>Create your first issue and open detail</li>
        <li>
          {projectType === "team"
            ? "If this is a team project, invite members from Settings"
            : "Keep setup lightweight and move directly into issue triage"}
        </li>
      </ol>
    </aside>
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
}: ProjectAccessCardProps) {
  const [memberQuery, setMemberQuery] = useState("");
  const currentMember = members.find((member) => member.isCurrentUser);
  const canManageAccess = currentMember ? currentMember.role === "owner" : true;
  const canInviteMembers = projectType === "team" && canManageAccess;
  const normalizedMemberQuery = memberQuery.trim().toLowerCase();
  const filteredMembers = members.filter((member) => {
    if (!normalizedMemberQuery) {
      return true;
    }

    return [member.name, member.id, member.note, member.role]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedMemberQuery));
  });
  const filteredInvitations = invitations.filter((invitation) => {
    if (!normalizedMemberQuery) {
      return true;
    }

    return [invitation.email, invitation.invitedBy]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedMemberQuery));
  });

  return (
    <section className="rounded-[18px] border border-[#E6E8EC] bg-white p-6">
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
              <Button
                className="w-full justify-center md:w-auto"
                disabled={!canInviteMembers}
                type="submit"
              >
                Send invite
              </Button>
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
                    <Button size="sm" type="submit" variant="secondary">
                      Resend
                    </Button>
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
                    <Button size="sm" type="submit" variant="ghost">
                      Revoke
                    </Button>
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

        <div className="flex flex-col gap-3">
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
                      <Button size="sm" type="submit" variant="ghost">
                        Remove
                      </Button>
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
