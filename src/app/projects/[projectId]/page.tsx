import type { SidebarItemVariant } from "@/components/molecules/SidebarItem";
import { createIssueAction } from "@/features/issues/actions/create-issue-action";
import { inviteProjectMemberAction } from "@/features/projects/actions/invite-project-member-action";
import { manageProjectInvitationAction } from "@/features/projects/actions/manage-project-invitation-action";
import { manageProjectMemberAction } from "@/features/projects/actions/manage-project-member-action";
import { ProjectWorkspaceScreen } from "@/features/projects/components/project-workspace-screen";
import { loadProjectWorkspace } from "@/features/projects/lib/load-project-workspace";
import { getProjectPath } from "@/features/projects/lib/project-routes";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    inviteAccepted?: string;
    inviteEmail?: string;
    inviteError?: string;
    inviteNotice?: string;
    inviteSent?: string;
    statuses?: string;
  }>;
}

function getActiveProjectNavigation(
  statuses?: string
): Extract<SidebarItemVariant, "issues" | "triage" | "active" | "backlog"> {
  const normalizedStatuses = statuses
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!normalizedStatuses?.length) {
    return "issues";
  }

  if (normalizedStatuses.length === 1 && normalizedStatuses[0] === "Triage") {
    return "triage";
  }

  if (
    normalizedStatuses.length === 1 &&
    normalizedStatuses[0] === "In Progress"
  ) {
    return "active";
  }

  if (normalizedStatuses.length === 1 && normalizedStatuses[0] === "Backlog") {
    return "backlog";
  }

  return "issues";
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const {
    accessibleProjects,
    createdByLabel,
    invitations,
    members,
    project,
    summary,
  } = await loadProjectWorkspace(projectId, getProjectPath(projectId));

  return (
    <ProjectWorkspaceScreen
      action={createIssueAction.bind(null, projectId)}
      activeNavigation={getActiveProjectNavigation(query.statuses)}
      createdByLabel={createdByLabel}
      inviteAction={inviteProjectMemberAction.bind(null, projectId)}
      invitationAction={manageProjectInvitationAction.bind(null, projectId)}
      memberAction={manageProjectMemberAction.bind(null, projectId)}
      inviteErrorMessage={query.inviteError}
      inviteNoticeMessage={
        query.inviteNotice ??
        (query.inviteSent === "1" && query.inviteEmail
          ? `Invitation sent to ${query.inviteEmail}.`
          : undefined)
      }
      inviteValue={query.inviteEmail}
      invitations={invitations}
      members={members}
      project={project}
      projects={accessibleProjects}
      summary={summary}
      workspaceNoticeMessage={
        query.inviteAccepted === "1"
          ? `You joined ${project.name}. The board and project access are ready.`
          : undefined
      }
    />
  );
}
