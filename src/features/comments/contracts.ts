/**
 * Comment domain input/output contracts
 */

import type { Comment, CommentThread, CommentWithAuthor } from "./types";

// Client-facing action input types (no user identity fields — injected from session)
export interface CreateCommentActionInput {
  issueId: string;
  projectId: string;
  body: string;
  parentCommentId?: string | null;
}

export interface UpdateCommentActionInput {
  commentId: string;
  body: string;
}

export interface DeleteCommentActionInput {
  commentId: string;
  projectId: string;
}

// Repository-facing input types (include server-injected identity fields)
export interface CreateCommentInput {
  issueId: string;
  projectId: string;
  authorId: string;
  body: string;
  parentCommentId?: string | null;
}

export interface UpdateCommentInput {
  commentId: string;
  body: string;
  updatedBy: string;
}

export interface DeleteCommentInput {
  commentId: string;
  deletedBy: string;
}

export interface ListCommentsInput {
  issueId: string;
  projectId: string;
  includeDeleted?: boolean;
}

export interface GetCommentThreadInput {
  issueId: string;
  rootCommentId: string;
  projectId: string;
}

export interface SearchCommentsInput {
  issueId: string;
  projectId: string;
  query: string;
  limit?: number;
}

export interface PaginatedComments {
  comments: CommentWithAuthor[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CommentsRepository {
  // Core CRUD
  createComment(input: CreateCommentInput): Promise<Comment>;
  updateComment(input: UpdateCommentInput): Promise<Comment>;
  deleteComment(input: DeleteCommentInput): Promise<void>;
  getCommentById(commentId: string): Promise<Comment | null>;

  // Query operations
  listCommentsByIssueId(input: ListCommentsInput): Promise<Comment[]>;
  getCommentThread(input: GetCommentThreadInput): Promise<CommentThread>;
  listReplies(commentId: string): Promise<Comment[]>;
  searchComments(input: SearchCommentsInput): Promise<Comment[]>;

  // Permission checks
  canEditComment(commentId: string, userId: string): Promise<boolean>;
  canDeleteComment(commentId: string, userId: string): Promise<boolean>;
}
