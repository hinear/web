import type { IssuesRepository } from "@/features/issues/contracts";
import { createIssueDraft } from "@/features/issues/lib/create-issue";
import { getIssuePath } from "@/features/projects/lib/paths";

export interface CreateIssueFlowInput {
  actorId: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
}

export async function createIssueFlow(
  repository: IssuesRepository,
  input: CreateIssueFlowInput
): Promise<string> {
  const draft = createIssueDraft({
    projectId: input.projectId,
    title: input.title,
    description: input.description,
    assigneeId: input.assigneeId,
    createdBy: input.actorId,
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
