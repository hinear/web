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
  dueDate: string | null;
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

export interface ListIssuesByProjectInput {
  projectId: string;
}

export interface ListIssuesByStatusInput extends ListIssuesByProjectInput {
  status: IssueStatus;
}

export interface ListIssuesByAssigneeInput extends ListIssuesByProjectInput {
  assigneeId: string;
}

export interface ListIssuesByPriorityInput extends ListIssuesByProjectInput {
  priority: IssuePriority;
}

export interface ListIssuesByLabelInput extends ListIssuesByProjectInput {
  labelId: string;
}

export interface SearchIssuesInput extends ListIssuesByProjectInput {
  query: string;
}

export interface GetIssuesByProjectPageInput {
  projectId: string;
  page: number;
  limit: number;
}

export interface PaginatedIssues {
  issues: Issue[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterIssuesInput {
  projectId: string;
  statuses?: IssueStatus[];
  priorities?: IssuePriority[];
  assigneeIds?: string[];
  labelIds?: string[];
  searchQuery?: string;
  dueBefore?: string;
  dueAfter?: string;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
}

export interface IssuesRepository {
  createIssue(input: CreateIssueInput): Promise<Issue>;
  createComment(input: CreateCommentInput): Promise<Comment>;
  getCommentById(commentId: string): Promise<Comment>;
  updateComment(commentId: string, updates: { body: string }): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">
  ): Promise<ActivityLogEntry>;
  getIssueById(issueId: string): Promise<Issue | null>;
  updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue>;

  // 필터링 메서드
  listIssuesByStatus(input: ListIssuesByStatusInput): Promise<Issue[]>;
  listIssuesByAssignee(input: ListIssuesByAssigneeInput): Promise<Issue[]>;
  listIssuesByPriority(input: ListIssuesByPriorityInput): Promise<Issue[]>;
  listIssuesByLabel(input: ListIssuesByLabelInput): Promise<Issue[]>;

  // 검색 메서드
  searchIssues(input: SearchIssuesInput): Promise<Issue[]>;

  // 페이지네이션 메서드
  getIssuesByProjectPage(
    input: GetIssuesByProjectPageInput
  ): Promise<PaginatedIssues>;

  // 카운트 메서드
  countIssuesByProject(projectId: string): Promise<number>;
  countIssuesByStatus(projectId: string): Promise<Record<IssueStatus, number>>;

  // 고급 필터링 메서드
  filterIssues(input: FilterIssuesInput): Promise<Issue[]>;
}

export function isConflictError(error: unknown): error is ConflictError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "type" in error &&
      (error as { type?: string }).type === "CONFLICT"
  );
}
