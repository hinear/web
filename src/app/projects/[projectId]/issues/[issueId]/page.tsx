import { notFound } from "next/navigation";

import { createIssueAction } from "@/features/issues/actions/create-issue-action";
import { IssueDetailDrawerScreen } from "@/features/issues/components/issue-detail-drawer-screen";
import { IssueDetailFullPageScreen } from "@/features/issues/components/issue-detail-full-page-screen";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { inviteProjectMemberAction } from "@/features/projects/actions/invite-project-member-action";
import { manageProjectInvitationAction } from "@/features/projects/actions/manage-project-invitation-action";
import { manageProjectMemberAction } from "@/features/projects/actions/manage-project-member-action";
import { ProjectWorkspaceScreen } from "@/features/projects/components/project-workspace-screen";
import { loadProjectWorkspace } from "@/features/projects/lib/load-project-workspace";
import { getProjectPath } from "@/features/projects/lib/paths";

interface IssueDetailPageProps {
  params: Promise<{
    projectId: string;
    issueId: string;
  }>;
  searchParams: Promise<{
    view?: string;
  }>;
}

export default async function IssueDetailPage({
  params,
  searchParams,
}: IssueDetailPageProps) {
  const { issueId, projectId } = await params;
  const { view } = await searchParams;
  const repository = await getServerIssuesRepository();
  const workspace = await loadProjectWorkspace(
    projectId,
    `/projects/${projectId}/issues/${issueId}`
  );
  const issue = await repository.getIssueById(issueId);

  if (!issue || issue.projectId !== projectId) {
    notFound();
  }

  const [comments, activityLog] = await Promise.all([
    repository.listCommentsByIssueId(issueId),
    repository.listActivityLogByIssueId(issueId),
  ]);

  if (view === "full") {
    return (
      <IssueDetailFullPageScreen
        activityLog={activityLog}
        boardHref={getProjectPath(projectId)}
        comments={comments}
        issue={issue}
      />
    );
  }

  const membersById = new Map(
    workspace.members.map((member) => [member.id, member.name])
  );
  const assigneeOptions = [
    { label: "Unassigned", value: "" },
    ...workspace.members.map((member) => ({
      label: member.name,
      value: member.id,
    })),
  ];

  return (
    <div className="relative min-h-screen bg-[#FCFCFD]">
      <ProjectWorkspaceScreen
        action={createIssueAction.bind(null, projectId)}
        createdByLabel={workspace.createdByLabel}
        inviteAction={inviteProjectMemberAction.bind(null, projectId)}
        invitationAction={manageProjectInvitationAction.bind(null, projectId)}
        inviteErrorMessage={undefined}
        inviteNoticeMessage={undefined}
        inviteValue={undefined}
        invitations={workspace.invitations}
        memberAction={manageProjectMemberAction.bind(null, projectId)}
        members={workspace.members}
        project={workspace.project}
        summary={workspace.summary}
        workspaceNoticeMessage={undefined}
      />

      <div className="pointer-events-none absolute inset-0 bg-[rgba(15,23,42,0.4)]" />

      <div className="pointer-events-none absolute inset-0 p-6">
        <div className="flex h-full justify-end">
          <IssueDetailDrawerScreen
            activityLog={activityLog}
            assigneeOptions={assigneeOptions}
            boardHref={getProjectPath(projectId)}
            createdByName={membersById.get(issue.createdBy) ?? issue.createdBy}
            fullPageHref={`/projects/${projectId}/issues/${issueId}?view=full`}
            issue={issue}
            lastEditedByName={
              membersById.get(issue.updatedBy) ?? issue.updatedBy
            }
          />
        </div>
      </div>
    </div>
  );
}
