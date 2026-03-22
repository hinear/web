import { inviteProjectMemberAction } from "@/features/projects/actions/invite-project-member-action";
import { manageProjectInvitationAction } from "@/features/projects/actions/manage-project-invitation-action";
import { manageProjectMemberAction } from "@/features/projects/actions/manage-project-member-action";
import { updateProjectAction } from "@/features/projects/actions/update-project-action";
import { ProjectSettingsScreen } from "@/features/projects/components/project-settings-screen";
import { loadProjectWorkspace } from "@/features/projects/lib/load-project-workspace";
import { getProjectSettingsPath } from "@/features/projects/lib/paths";

interface ProjectSettingsPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    inviteEmail?: string;
    inviteError?: string;
    inviteNotice?: string;
    inviteSent?: string;
    projectError?: string;
    projectNotice?: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: ProjectSettingsPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const { accessibleProjects, invitations, members, project } =
    await loadProjectWorkspace(projectId, getProjectSettingsPath(projectId));

  return (
    <ProjectSettingsScreen
      detailsAction={updateProjectAction.bind(null, projectId)}
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
      projectErrorMessage={query.projectError}
      projectNoticeMessage={query.projectNotice}
      project={project}
      projects={accessibleProjects}
    />
  );
}
