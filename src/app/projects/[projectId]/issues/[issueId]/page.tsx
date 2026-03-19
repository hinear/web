import { notFound } from "next/navigation";

import { IssueDetailScreen } from "@/features/issues/components/issue-detail-screen";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";

interface IssueDetailPageProps {
  params: Promise<{
    projectId: string;
    issueId: string;
  }>;
}

export default async function IssueDetailPage({
  params,
}: IssueDetailPageProps) {
  const { projectId, issueId } = await params;
  const repository = getServerIssuesRepository();
  const issue = await repository.getIssueById(issueId);

  if (!issue || issue.projectId !== projectId) {
    notFound();
  }

  return <IssueDetailScreen issue={issue} />;
}
