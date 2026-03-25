import { createClient } from "@supabase/supabase-js";
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

  // 라벨 조회
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const { data: labels } = await supabase
    .from("labels")
    .select()
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  const assigneeOptions = [
    { label: "Unassigned", value: "" },
    ...issueDetail.assigneeOptions,
  ];

  return (
    <IssueDetailFullPageScreen
      activityLog={issueDetail.activityLog}
      assigneeOptions={assigneeOptions}
      availableLabels={labels ?? []}
      boardHref={`/projects/${projectId}`}
      comments={issueDetail.comments}
      issue={issueDetail.issue}
      memberNamesById={issueDetail.memberNamesById}
    />
  );
}
