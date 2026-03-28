import type { CursorPaginationMeta } from "@/app/api/_lib/contracts";
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
  id: string;
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

export interface DeleteIssueInput {
  issueId: string;
  deletedBy: string;
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
  limit?: number;
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
  listCommentsByIssueId(issueId: string): Promise<Comment[]>;
  updateComment(commentId: string, updates: { body: string }): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">
  ): Promise<ActivityLogEntry>;
  listActivityLogByIssueId(issueId: string): Promise<ActivityLogEntry[]>;
  getIssueById(issueId: string): Promise<Issue | null>;
  listIssuesByProject(projectId: string): Promise<Issue[]>;
  updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue>;
  deleteIssue(input: DeleteIssueInput): Promise<void>;

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

// Attachment types for image upload functionality
export interface AttachmentUploadInput {
  issueId: string;
  projectId: string;
  file: File;
  uploadedBy: string;
}

export interface AttachmentUploadResult {
  storagePath: string;
  publicUrl: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  attachmentId: string;
}

export interface IssueAttachmentsRepository {
  uploadAttachment(
    input: AttachmentUploadInput
  ): Promise<AttachmentUploadResult>;
  deleteAttachment(storagePath: string, issueId: string): Promise<void>;
}

export function isConflictError(error: unknown): error is ConflictError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "type" in error &&
      (error as { type?: string }).type === "CONFLICT"
  );
}

export interface IssueResource {
  createdAt: string;
  description: string;
  id: string;
  identifier: string;
  priority: IssuePriority;
  projectId: string;
  status: IssueStatus;
  title: string;
  updatedAt: string;
  version: number;
}

export interface CreateIssueRequest {
  assigneeId?: string | null;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  title: string;
}

export interface UpdateIssueRequest {
  assigneeId?: string | null;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  title?: string;
  version: number;
}

export interface IssueCollectionQuery {
  cursor?: string;
  limit?: number;
  priority?: IssuePriority;
  status?: IssueStatus;
}

export interface IssueCollectionResponse {
  items: IssueResource[];
  pagination: CursorPaginationMeta;
}
