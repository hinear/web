import type { ActivityLogEntry, Comment, Issue } from "@/features/issues/types";

export interface IssueUpdateResponse {
  activityLog: ActivityLogEntry[];
  issue: Issue;
}

export interface CommentCreateResponse {
  activityEntry: ActivityLogEntry;
  comment: Comment;
}

export interface ConflictError {
  currentIssue: Issue;
  currentVersion: number;
  message: string;
  requestedVersion: number;
  type: "CONFLICT";
}

export function isIssueUpdateResponse(
  value: unknown
): value is IssueUpdateResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "issue" in value &&
      "activityLog" in value
  );
}

export function isCommentCreateResponse(
  value: unknown
): value is CommentCreateResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "comment" in value &&
      "activityEntry" in value
  );
}

export function isConflictError(value: unknown): value is ConflictError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      value.type === "CONFLICT" &&
      "currentIssue" in value
  );
}
