import type { Issue } from "@/features/issues/types";
import type {
  Issue as BoardIssue,
  IssueStatus as BoardIssueStatus,
} from "@/specs/issue-detail.contract";

function toBoardIssueStatus(status: Issue["status"]): BoardIssueStatus {
  return status === "Closed" ? "Done" : status;
}

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
    status: toBoardIssueStatus(issue.status),
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
    dueDate: issue.dueDate,
    comments: [],
    activityLog: [],
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}
