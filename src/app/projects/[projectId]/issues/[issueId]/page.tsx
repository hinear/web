import { IssueDetailFullPageScreen } from "@/features/issues/components/issue-detail-full-page-screen";
import { loadIssueDetail } from "@/features/issues/lib/issue-detail-loader";

interface IssueDetailPageProps {
  params: Promise<{
    projectId: string;
    issueId: string;
  }>;
}

export default async function IssueDetailPage({
  params,
}: IssueDetailPageProps) {
  const { issueId, projectId } = await params;
  const issueDetail = await loadIssueDetail(
    projectId,
    issueId,
    `/projects/${projectId}/issues/${issueId}`
  );

  const assigneeOptions = [
    { label: "Unassigned", value: "" },
    ...issueDetail.assigneeOptions,
  ];
  const availableLabels = [
    ...issueDetail.availableLabels,
    ...issueDetail.issue.labels.filter(
      (issueLabel) =>
        !issueDetail.availableLabels.some((label) => label.id === issueLabel.id)
    ),
  ];

  return (
    <IssueDetailFullPageScreen
      activityLog={issueDetail.activityLog}
      assigneeOptions={assigneeOptions}
      availableLabels={availableLabels}
      boardHref={`/projects/${projectId}`}
      comments={issueDetail.comments}
      githubRepository={
        issueDetail.project.githubIntegrationEnabled &&
        issueDetail.project.githubRepoOwner &&
        issueDetail.project.githubRepoName
          ? {
              owner: issueDetail.project.githubRepoOwner,
              name: issueDetail.project.githubRepoName,
            }
          : null
      }
      initialNow={Date.now()}
      issue={issueDetail.issue}
      memberNamesById={issueDetail.memberNamesById}
    />
  );
}
