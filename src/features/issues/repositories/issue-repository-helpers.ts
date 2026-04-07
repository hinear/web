import type { PostgrestError } from "@supabase/supabase-js";

import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type {
  ActivityLogEntry,
  Comment,
  Issue,
  Label,
} from "@/features/issues/types";

export function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw createPostgrestRepositoryError(context, error);
  }
}

export function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw createRepositoryError(
      "UNKNOWN",
      `${context}: query returned no rows.`
    );
  }

  return data;
}

export function mapIssue(row: any): Issue {
  return {
    id: row.id,
    projectId: row.project_id,
    issueNumber: row.issue_number,
    identifier: row.identifier,
    title: row.title,
    status: row.status as Issue["status"],
    priority: row.priority as Issue["priority"],
    assigneeId: row.assignee_id,
    labels: [],
    description: row.description,
    dueDate: row.due_date,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    githubIssueId: (row as any).github_issue_id ?? null,
    githubIssueNumber: (row as any).github_issue_number ?? null,
    githubSyncedAt: (row as any).github_synced_at ?? null,
    githubSyncStatus: (row as any).github_sync_status ?? "pending",
  };
}

export function mapLabel(row: any): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

export function mapComment(row: any): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function mapActivityLogEntry(row: any): ActivityLogEntry {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    actorId: row.actor_id,
    type: row.type as ActivityLogEntry["type"],
    field: row.field,
    from: row.from_value,
    to: row.to_value,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export function getDescriptionUpdateSummary(
  previous: string,
  next: string
): string {
  if (previous.trim().length === 0 && next.trim().length > 0) {
    return "설명을 추가했습니다";
  }

  if (previous.trim().length > 0 && next.trim().length === 0) {
    return "설명을 비웠습니다";
  }

  return "설명을 업데이트했습니다";
}

export function buildIssueSearchQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .map((token) => token.replaceAll("'", ""))
    .filter(Boolean)
    .join(" ");
}
