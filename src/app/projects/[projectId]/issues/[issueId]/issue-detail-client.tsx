"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createIssueAction } from "@/features/issues/actions/create-issue-action";
import { IssueDetailDrawerScreen } from "@/features/issues/components/issue-detail-drawer-screen";
import { IssueDetailFullPageScreen } from "@/features/issues/components/issue-detail-full-page-screen";
import { useIssueDetail } from "@/features/issues/hooks/use-issues";
import type { ActivityLogEntry, Comment, Issue } from "@/features/issues/types";
import { inviteProjectMemberAction } from "@/features/projects/actions/invite-project-member-action";
import { manageProjectInvitationAction } from "@/features/projects/actions/manage-project-invitation-action";
import { manageProjectMemberAction } from "@/features/projects/actions/manage-project-member-action";
import { ProjectWorkspaceScreen } from "@/features/projects/components/project-workspace-screen";
import { getProjectPath } from "@/features/projects/lib/paths";

interface IssueDetailClientProps {
  issueId: string;
  projectId: string;
  view?: string;
  workspace: any;
  assigneeOptions: Array<{ label: string; value: string }>;
  membersById: Map<string, string>;
  memberNamesById: Record<string, string>;
}

export function IssueDetailClient({
  issueId,
  projectId,
  view,
  workspace,
  assigneeOptions,
  membersById,
  memberNamesById,
}: IssueDetailClientProps) {
  const router = useRouter();
  const { data: issueDetail, isLoading, error } = useIssueDetail(issueId);

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  // issueDetail 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (issueDetail) {
      setIssue(issueDetail.issue);
      setComments(issueDetail.comments);
      setActivityLog(issueDetail.activityLog);
    }
  }, [issueDetail]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error || !issueDetail) {
    return (
      <div className="p-8 text-center text-red-500">
        {error?.message || "Failed to load issue"}
      </div>
    );
  }

  if (!issue) {
    notFound();
  }

  if (view === "full") {
    return (
      <IssueDetailFullPageScreen
        activityLog={activityLog}
        assigneeOptions={assigneeOptions}
        boardHref={getProjectPath(projectId)}
        comments={comments}
        issue={issue}
        memberNamesById={memberNamesById}
      />
    );
  }

  return (
    <>
      <div className="md:hidden">
        <IssueDetailFullPageScreen
          activityLog={activityLog}
          assigneeOptions={assigneeOptions}
          boardHref={getProjectPath(projectId)}
          comments={comments}
          issue={issue}
          memberNamesById={memberNamesById}
        />
      </div>

      <div className="relative hidden min-h-screen bg-[#FCFCFD] md:block">
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
              createdByName={
                membersById.get(issue.createdBy) ?? issue.createdBy
              }
              fullPageHref={`/projects/${projectId}/issues/${issueId}?view=full`}
              issue={issue}
              lastEditedByName={
                membersById.get(issue.updatedBy) ?? issue.updatedBy
              }
              memberNamesById={memberNamesById}
            />
          </div>
        </div>
      </div>
    </>
  );
}
