/**
 * Comment domain models
 */

export interface Comment {
  id: string;
  issueId: string;
  projectId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  // Thread support for future nested replies
  parentCommentId?: string | null;
  threadId?: string | null;
}

export interface CommentThread {
  rootComment: Comment;
  replies: Comment[];
  replyCount: number;
}

export interface CommentWithAuthor extends Comment {
  authorName: string;
  authorAvatarUrl: string | null;
  replies?: CommentWithAuthor[];
}

export interface CommentThreadWithAuthor extends CommentThread {
  rootComment: CommentWithAuthor;
  replies: CommentWithAuthor[];
}

export type CommentPermission = "read" | "write" | "delete";

export interface CommentPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canEdit: boolean;
}
