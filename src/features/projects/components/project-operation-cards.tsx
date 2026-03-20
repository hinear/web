import Link from "next/link";

import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import type {
  ProjectInvitationStatus,
  ProjectMemberRole,
  ProjectType,
} from "@/features/projects/types";

interface CreateProjectFormCardProps {
  action?: (formData: FormData) => void | Promise<void>;
  defaultType?: ProjectType;
}

interface CreateProjectNextStepsCardProps {
  projectType?: ProjectType;
}

interface ProjectAccessMember {
  id: string;
  name: string;
  role: ProjectMemberRole;
  note: string;
  isCurrentUser?: boolean;
  canRemove?: boolean;
}

interface ProjectAccessCardProps {
  inviteValue?: string;
  members?: ProjectAccessMember[];
}

interface InvitationAcceptCardProps {
  projectName: string;
  projectType: ProjectType;
  invitedBy: string;
  expiresAt: string;
  declineHref?: string;
  acceptHref?: string;
  status?: ProjectInvitationStatus;
}

const defaultMembers: ProjectAccessMember[] = [
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
  defaultChecked,
}: {
  value: ProjectType;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer flex-col gap-2 rounded-[18px] border bg-white p-[18px]",
        defaultChecked
          ? "border-[2px] border-[#818CF8] bg-[#EEF2FF]"
          : "border border-[#CBD5E1]",
      ].join(" ")}
    >
      <input
        className="sr-only"
        defaultChecked={defaultChecked}
        name="type"
        type="radio"
        value={value}
      />
      <span className="text-base font-bold text-[#111318]">{title}</span>
      <span
        className={
          defaultChecked
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
}: CreateProjectFormCardProps) {
  const content = (
    <>
      <h2 className="text-[18px] font-bold text-[#111318]">Project details</h2>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="project-name"
          className="text-[13px] font-semibold text-[#111318]"
        >
          Project name
        </label>
        <Field
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
          className="max-w-[180px] font-bold text-[#111318] placeholder:font-medium placeholder:text-[#8A90A2]"
          id="project-key"
          name="key"
          placeholder="HIN"
          required
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
            defaultChecked={defaultType === "personal"}
            description="Use this when you are working alone. Invitations stay hidden and settings remain simpler."
            title="Personal"
            value="personal"
          />
          <ProjectTypeOption
            defaultChecked={defaultType === "team"}
            description="Use this when you want owners, members, invitations, and shared issue ownership from the start."
            title="Team"
            value="team"
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:justify-between">
        <p className="text-[13px] font-medium leading-5 text-[#4B5563]">
          After creation, land on the board and continue with issue setup.
        </p>
        <Button className="w-full justify-center md:w-auto" type="submit">
          Create project
        </Button>
      </div>
    </>
  );

  return (
    <section className="rounded-[24px] border border-[#E6E8EC] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
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
    <aside className="rounded-[24px] border border-[#E6E8EC] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <h2 className="text-[18px] font-bold text-[#111318]">
        What happens next
      </h2>
      <ol className="mt-4 flex list-decimal flex-col gap-4 pl-5 text-[14px] font-semibold text-[#111318]">
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
  inviteValue = "teammate@hinear.app",
  members = defaultMembers,
}: ProjectAccessCardProps) {
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
          <Field
            aria-label="Invite member"
            defaultValue={inviteValue}
            name="inviteEmail"
          />
          <p className="text-[11px] font-medium leading-5 text-[#6B7280]">
            Only owners can send invites. Duplicate pending invitations should
            show resend guidance instead of creating another row.
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Link
              className="text-[12px] font-semibold text-[#5E6AD2]"
              href="/playground/components"
            >
              View pending invitations
            </Link>
            <Button className="w-full justify-center md:w-auto" type="button">
              Send invite
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[16px] font-bold text-[#111318]">
            Current team ({members.length})
          </h3>
          <Field
            aria-label="Search members"
            defaultValue=""
            placeholder="Search members by name or email"
          />
          <p className="text-[11px] font-medium leading-5 text-[#6B7280]">
            Owners can remove members. Members can view the roster but cannot
            change access.
          </p>

          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-[14px] border border-[#D6DAE1] bg-white p-[14px] md:flex-row md:items-center md:justify-between"
            >
              <div className="text-[14px] font-semibold text-[#111318]">
                {member.name}{" "}
                <span className="font-medium text-[#6B7280]">
                  {member.role}
                </span>{" "}
                <span className="font-medium text-[#111318]">
                  {member.note}
                </span>
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
                <span
                  className={[
                    "inline-flex min-h-10 items-center justify-center rounded-[10px] border px-3 text-[12px] font-semibold",
                    member.canRemove
                      ? "border-[#FDBA74] bg-[#FFF7ED] text-[#9A3412]"
                      : "border-[#E5E7EB] bg-white text-[#9CA3AF]",
                  ].join(" ")}
                >
                  {member.canRemove ? "Remove" : "Cannot remove self"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InvitationAcceptCard({
  projectName,
  projectType,
  invitedBy,
  expiresAt,
  declineHref = "/",
  acceptHref = "/projects/new",
  status = "pending",
}: InvitationAcceptCardProps) {
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
          {invitedBy} invited you to join this {projectType} project. Accept to
          collaborate on issues, comments, and shared ownership.
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
          <h3 className="text-[15px] font-bold text-[#4338CA]">What you get</h3>
          <p className="mt-2 text-[13px] font-medium leading-5 text-[#4338CA]">
            After acceptance, redirect to the project board. If you are not
            signed in, require auth first and return here.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[#E6E8EC] bg-white px-4 text-[14px] font-bold text-[#111318]"
            href={declineHref}
          >
            Decline
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#5E6AD2] px-4 text-[14px] font-bold text-white"
            href={acceptHref}
          >
            Accept invitation
          </Link>
        </div>
      </div>
    </section>
  );
}
