import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  CommentsRepository,
  CreateCommentInput,
  DeleteCommentInput,
  GetCommentThreadInput,
  ListCommentsInput,
  SearchCommentsInput,
  UpdateCommentInput,
} from "@/features/comments/contracts";
import type { Comment, CommentThread } from "@/features/comments/types";
import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableInsert, TableRow } from "@/lib/supabase/types";

type CommentRow = TableRow<"comments"> & {
  parent_comment_id?: string | null;
  thread_id?: string | null;
  updated_at?: string | null;
};

type CommentInsert = TableInsert<"comments"> & {
  parent_comment_id?: string | null;
  thread_id?: string | null;
};

function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw createPostgrestRepositoryError(context, error);
  }
}

function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw createRepositoryError(
      "UNKNOWN",
      `${context}: query returned no rows.`
    );
  }

  return data;
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    parentCommentId: row.parent_comment_id ?? undefined,
    threadId: row.thread_id ?? undefined,
  };
}

export class SupabaseCommentsRepository implements CommentsRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const insertData: CommentInsert = {
      issue_id: input.issueId,
      project_id: input.projectId,
      author_id: input.authorId,
      body: input.body,
    };

    // Set parent comment and thread if this is a reply
    if (input.parentCommentId) {
      const parentComment = await this.getCommentById(input.parentCommentId);
      if (!parentComment) {
        throw createRepositoryError("UNKNOWN", "Parent comment not found.");
      }

      insertData.parent_comment_id = input.parentCommentId;
      // Use the parent's thread_id, or the parent's id if it's a root comment
      insertData.thread_id = parentComment.threadId || parentComment.id;
    }

    const { data, error } = await this.client
      .from("comments")
      .insert(insertData)
      .select()
      .single();

    assertQuerySucceeded("Failed to create comment", error);

    return mapComment(assertDataPresent("Failed to create comment", data));
  }

  async updateComment(input: UpdateCommentInput): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .update({
        body: input.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.commentId)
      .select()
      .single();

    assertQuerySucceeded("Failed to update comment", error);

    return mapComment(assertDataPresent("Failed to update comment", data));
  }

  async deleteComment(input: DeleteCommentInput): Promise<void> {
    const { error } = await this.client
      .from("comments")
      .delete()
      .eq("id", input.commentId);

    assertQuerySucceeded("Failed to delete comment", error);
  }

  async getCommentById(commentId: string): Promise<Comment | null> {
    const { data, error } = await this.client
      .from("comments")
      .select()
      .eq("id", commentId)
      .maybeSingle();

    assertQuerySucceeded("Failed to get comment", error);

    if (!data) {
      return null;
    }

    return mapComment(data);
  }

  async listCommentsByIssueId(input: ListCommentsInput): Promise<Comment[]> {
    const query = this.client
      .from("comments")
      .select()
      .eq("issue_id", input.issueId)
      .order("created_at", { ascending: false });

    if (!input.includeDeleted) {
      // Filter out soft-deleted comments if needed
      // query = query.is("deleted_at", null);
    }

    const { data, error } = await query;

    assertQuerySucceeded("Failed to list comments", error);

    return (data ?? []).map(mapComment);
  }

  async getCommentThread(input: GetCommentThreadInput): Promise<CommentThread> {
    const rootComment = await this.getCommentById(input.rootCommentId);

    if (!rootComment) {
      throw createRepositoryError("UNKNOWN", "Root comment not found.");
    }

    // Get all replies in the thread
    const threadId = rootComment.threadId || rootComment.id;
    const { data: repliesData, error: repliesError } = await this.client
      .from("comments")
      .select()
      .eq("thread_id", threadId)
      .neq("id", rootComment.id)
      .order("created_at", { ascending: true });

    assertQuerySucceeded("Failed to load comment replies", repliesError);

    const replies = (repliesData ?? []).map(mapComment);

    return {
      rootComment,
      replies,
      replyCount: replies.length,
    };
  }

  async listReplies(commentId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from("comments")
      .select()
      .eq("parent_comment_id", commentId)
      .order("created_at", { ascending: true });

    assertQuerySucceeded("Failed to list replies", error);

    return (data ?? []).map(mapComment);
  }

  async searchComments(input: SearchCommentsInput): Promise<Comment[]> {
    const { data, error } = await this.client
      .from("comments")
      .select()
      .eq("issue_id", input.issueId)
      .ilike("body", `%${input.query}%`)
      .limit(input.limit ?? 50)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to search comments", error);

    return (data ?? []).map(mapComment);
  }

  async canEditComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.getCommentById(commentId);
    if (!comment) {
      return false;
    }

    // User can edit if they are the author
    return comment.authorId === userId;
  }

  async canDeleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.getCommentById(commentId);
    if (!comment) {
      return false;
    }

    // User can delete if they are the author
    // TODO: Add project member/owner check later
    return comment.authorId === userId;
  }
}
