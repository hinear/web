import type { IssuesRepository } from "@/features/issues/contracts";
import { createIssueDraft } from "@/features/issues/lib/create-issue";
import { getIssuePath } from "@/features/projects/lib/paths";

export interface CreateIssueFlowInput {
  actorId: string;
  assigneeId?: string | null;
  description?: string;
  labels?: string[];
  priority?: "No Priority" | "Low" | "Medium" | "High" | "Urgent";
  projectId: string;
  status?: "Triage" | "Backlog" | "Todo" | "In Progress" | "Done" | "Canceled";
  title: string;
}

export async function createIssueFlow(
  repository: IssuesRepository,
  input: CreateIssueFlowInput
): Promise<string> {
  const draft = createIssueDraft({
    assigneeId: input.assigneeId,
    createdBy: input.actorId,
    description: input.description,
    labels: input.labels,
    priority: input.priority,
    projectId: input.projectId,
    status: input.status,
    title: input.title,
  });

  const issue = await repository.createIssue(draft);

  await repository.appendActivityLog({
    issueId: issue.id,
    projectId: issue.projectId,
    actorId: input.actorId,
    type: "issue.created",
    field: null,
    from: null,
    to: null,
    summary: `Created issue ${issue.identifier}.`,
  });

  return getIssuePath(issue.projectId, issue.id);
}
