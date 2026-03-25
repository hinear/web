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

  return (
    <IssueDetailFullPageScreen
      activityLog={issueDetail.activityLog}
      assigneeOptions={assigneeOptions}
      boardHref={`/projects/${projectId}`}
      comments={issueDetail.comments}
      issue={issueDetail.issue}
      memberNamesById={issueDetail.memberNamesById}
    />
  );
}
