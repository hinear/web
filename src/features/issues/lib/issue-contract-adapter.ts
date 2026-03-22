import type { Issue } from "@/features/issues/types";
import type { Issue as BoardIssue } from "@/specs/issue-detail.contract";

export function toBoardIssue(
  issue: Issue,
  assignee?: {
    avatarUrl?: string | null;
    name: string;
  } | null
): BoardIssue {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    assignee: issue.assigneeId
      ? {
          id: issue.assigneeId,
          avatarUrl: assignee?.avatarUrl ?? undefined,
          name: assignee?.name ?? issue.assigneeId,
        }
      : null,
    labels: issue.labels,
    description: issue.description,
    comments: [],
    activityLog: [],
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}
