import type {
  ActivityLogEntry,
  Comment,
  ConflictError,
  Issue,
  IssuePriority,
  IssueStatus,
  Label,
} from "@/features/issues/types";

// API 응답을 위한 타입들
export interface Assignee {
  name: string;
  avatarUrl: string | null;
}

export interface BoardIssue {
  id: string;
  identifier: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: Assignee | null;
  labels: Label[];
  issueNumber: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueDetail {
  id: string;
  projectId: string;
  issueNumber: number;
  identifier: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  labels: Label[];
  description: string | null;
  dueDate: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  // 확장 필드
  assignee: Assignee | null;
  createdByUser: { name: string; avatarUrl: string | null } | null;
  updatedByUser: { name: string; avatarUrl: string | null } | null;
  comments: Array<
    Comment & { authorName: string; authorAvatarUrl: string | null }
  >;
  activityLog: Array<
    ActivityLogEntry & { actorName: string; actorAvatarUrl: string | null }
  >;
}

export interface CreateIssueInput {
  assigneeId?: string | null;
  createdBy: string;
  description?: string;
  dueDate?: string | null;
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
  dueDate?: string | null;
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
