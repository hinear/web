import type {
  ActivityLogEntry,
  Comment,
  ConflictError,
  Issue,
  IssuePriority,
  IssueStatus,
} from "@/features/issues/types";

export interface CreateIssueInput {
  assigneeId?: string | null;
  createdBy: string;
  description?: string;
  labels?: string[];
  priority?: IssuePriority;
  projectId: string;
  status?: IssueStatus;
  title: string;
}

export interface CreateCommentInput {
  issueId: string;
  projectId: string;
  authorId: string;
  body: string;
}

export interface UpdateIssueInput {
  assigneeId?: string | null;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  title?: string;
  updatedBy: string;
  version: number;
}

export interface IssuesRepository {
  createIssue(input: CreateIssueInput): Promise<Issue>;
  createComment(input: CreateCommentInput): Promise<Comment>;
  appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">
  ): Promise<ActivityLogEntry>;
  getIssueById(issueId: string): Promise<Issue | null>;
  updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue>;
}

export function isConflictError(error: unknown): error is ConflictError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "type" in error &&
      (error as { type?: string }).type === "CONFLICT"
  );
}
