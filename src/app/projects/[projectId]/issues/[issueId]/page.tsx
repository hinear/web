import { Suspense } from "react";

import { createIssueAction } from "@/features/issues/actions/create-issue-action";
import { IssueDetailDrawerScreen } from "@/features/issues/components/issue-detail-drawer-screen";
import { IssueDetailFullPageScreen } from "@/features/issues/components/issue-detail-full-page-screen";
import { inviteProjectMemberAction } from "@/features/projects/actions/invite-project-member-action";
import { manageProjectInvitationAction } from "@/features/projects/actions/manage-project-invitation-action";
import { manageProjectMemberAction } from "@/features/projects/actions/manage-project-member-action";
import { ProjectWorkspaceScreen } from "@/features/projects/components/project-workspace-screen";
import { loadProjectWorkspace } from "@/features/projects/lib/load-project-workspace";
import { IssueDetailClient } from "./issue-detail-client";

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
  const workspace = await loadProjectWorkspace(
    projectId,
    `/projects/${projectId}/issues/${issueId}`
  );

  const assigneeOptions = [
    { label: "Unassigned", value: "" },
    ...workspace.members.map((member) => ({
      label: member.name,
      value: member.id,
    })),
  ];

  const membersById = new Map(
    workspace.members.map((member) => [member.id, member.name])
  );
  const memberNamesById = Object.fromEntries(
    workspace.members.map((member) => [member.id, member.name])
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IssueDetailClient
        issueId={issueId}
        projectId={projectId}
        view={view}
        workspace={workspace}
        assigneeOptions={assigneeOptions}
        membersById={membersById}
        memberNamesById={memberNamesById}
      />
    </Suspense>
  );
}
