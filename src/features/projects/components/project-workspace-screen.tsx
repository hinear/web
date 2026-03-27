import type { SidebarItemVariant } from "@/components/molecules/SidebarItem";
import { SidebarDesktop } from "@/components/organisms/SidebarDesktop";
import { KanbanBoardView } from "@/features/issues/components/KanbanBoardView";
import { PerformanceProfilerMount } from "@/features/performance/components/PerformanceProfilerMount";
import {
  getProjectFilteredPath,
  getProjectOverviewPath,
  getProjectPath,
  getProjectSettingsPath,
} from "@/features/projects/lib/project-routes";
import type {
  Project,
  ProjectInvitationSummary,
  ProjectMemberSummary,
} from "@/features/projects/types";

interface ProjectWorkspaceScreenProps {
  action: (formData: FormData) => void | Promise<void>;
  activeNavigation?: SidebarItemVariant;
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
  activeNavigation = "issues",
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
      <PerformanceProfilerMount />
      <div className="hidden md:flex md:self-stretch">
        <SidebarDesktop
          activeNavigation={activeNavigation}
          defaultProjects={(projects ?? []).map((entry) => ({
            active: entry.id === project.id,
            href: getProjectPath(entry.id),
            label: entry.name,
          }))}
          dashboardHref={getProjectOverviewPath(project.id)}
          dashboardLabel="Overview"
          navigationHrefs={{
            active: getProjectFilteredPath(project.id, {
              statuses: ["In Progress"],
            }),
            backlog: getProjectFilteredPath(project.id, {
              statuses: ["Backlog"],
            }),
            issues: getProjectPath(project.id),
            triage: getProjectFilteredPath(project.id, {
              statuses: ["Triage"],
            }),
          }}
          projectSubtitle={projectSubtitle}
          projectTitle={project.name}
          settingsHref={getProjectSettingsPath(project.id)}
        />
      </div>

      <div className="min-w-0 flex flex-1 flex-col self-stretch">
        <div className="flex min-h-screen w-full flex-1 flex-col gap-5 bg-[#FCFCFD] p-6">
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
              dashboardHref={getProjectOverviewPath(project.id)}
              projectId={project.id}
              projectKey={project.key}
              projectName={project.name}
              projectOptions={(projects ?? []).map((entry) => ({
                active: entry.id === project.id,
                href: getProjectPath(entry.id),
                label: entry.name,
              }))}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
