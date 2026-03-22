import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";
import { SidebarDesktop } from "@/components/organisms/SidebarDesktop";
import { KanbanBoardView } from "@/features/issues/components/KanbanBoardView";
import {
  getProjectDashboardPath,
  getProjectPath,
  getProjectSettingsPath,
} from "@/features/projects/lib/paths";
import type {
  Project,
  ProjectInvitationSummary,
  ProjectMemberSummary,
} from "@/features/projects/types";

interface ProjectWorkspaceScreenProps {
  action: (formData: FormData) => void | Promise<void>;
  createdByLabel?: string;
  inviteAction?: (formData: FormData) => void | Promise<void>;
  invitationAction?: (formData: FormData) => void | Promise<void>;
  memberAction?: (formData: FormData) => void | Promise<void>;
  inviteErrorMessage?: string;
  inviteNoticeMessage?: string;
  inviteValue?: string;
  invitations?: ProjectInvitationSummary[];
  members?: ProjectMemberSummary[];
  project: Project;
  projects?: Project[];
  summary?: {
    activeIssueCount: number;
    doneIssueCount: number;
    memberCount: number;
    pendingInvitationCount: number;
    totalIssueCount: number;
  };
  workspaceNoticeMessage?: string;
}

export function ProjectWorkspaceScreen({
  action,
  members,
  project,
  projects,
  workspaceNoticeMessage,
}: ProjectWorkspaceScreenProps) {
  const projectSubtitle =
    project.type === "team" ? "Team Project" : "Personal Project";
  const assigneeOptions = [
    { label: "Assign to...", value: "" },
    ...(members ?? []).map((member) => ({
      label: member.name,
      value: member.id,
    })),
  ];

  return (
    <main className="min-h-screen bg-[var(--app-color-surface-0)] md:flex">
      <div className="hidden md:flex md:self-stretch">
        <SidebarDesktop
          defaultProjects={(projects ?? []).map((entry) => ({
            active: entry.id === project.id,
            href: getProjectPath(entry.id),
            label: entry.name,
          }))}
          dashboardHref={getProjectDashboardPath(project.id)}
          dashboardLabel="Open dashboard"
          navigationHrefs={{
            issues: getProjectPath(project.id),
          }}
          projectSubtitle={projectSubtitle}
          projectTitle={project.name}
          settingsHref={getProjectSettingsPath(project.id)}
        />
      </div>

      <div className="min-w-0 flex flex-1 flex-col self-stretch">
        <div className="flex min-h-screen w-full flex-1 flex-col gap-5 bg-[#FCFCFD] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 md:hidden">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--app-color-brand-500)]" />
              <span className="text-[16px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                Hinear
              </span>
            </div>
            <Link className={getButtonClassName("ghost")} href="/">
              Back to home
            </Link>
          </div>

          {workspaceNoticeMessage ? (
            <div
              className="rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-[14px] py-3 text-[12px] leading-5 font-[var(--app-font-weight-600)] text-[#1D4ED8]"
              role="status"
            >
              {workspaceNoticeMessage}
            </div>
          ) : null}

          <section className="min-w-0 flex-1">
            <KanbanBoardView
              assigneeOptions={assigneeOptions}
              boardHref={getProjectPath(project.id)}
              createIssueAction={action}
              dashboardHref={getProjectDashboardPath(project.id)}
              projectId={project.id}
              projectKey={project.key}
              projectName={project.name}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
