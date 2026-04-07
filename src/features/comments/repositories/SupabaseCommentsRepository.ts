import "server-only";

import type {
  CommentsRepository,
  CreateCommentInput,
  DeleteCommentInput,
  GetCommentThreadInput,
  ListCommentsInput,
  SearchCommentsInput,
  UpdateCommentInput,
} from "@/features/comments/contracts";
import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { Comment, CommentThread } from "../types";
import {
  assertDataPresent,
  assertQuerySucceeded,
  type CommentInsert,
  mapComment,
} from "./comment-mappers";

export class SupabaseCommentsRepository implements CommentsRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const insertData: CommentInsert = {
      issue_id: input.issueId,
      project_id: input.projectId,
      author_id: input.authorId,
      body: input.body,
    };

    if (input.parentCommentId) {
      const parentComment = await this.getCommentById(input.parentCommentId);
      if (!parentComment) {
        throw createRepositoryError("UNKNOWN", "Parent comment not found.");
      }

      insertData.parent_comment_id = input.parentCommentId;
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
    // Fetch root comment and replies in parallel.
    // For root comments (no parent), thread_id equals the root comment's id,
    // so we can query with thread_id = rootCommentId directly.
    const [rootResult, repliesResult] = await Promise.all([
      this.client
        .from("comments")
        .select()
        .eq("id", input.rootCommentId)
        .maybeSingle(),
      this.client
        .from("comments")
        .select()
        .eq("thread_id", input.rootCommentId)
        .neq("id", input.rootCommentId)
        .order("created_at", { ascending: true }),
    ]);

    assertQuerySucceeded("Failed to get root comment", rootResult.error);

    const rootComment = rootResult.data ? mapComment(rootResult.data) : null;

    if (!rootComment) {
      throw createRepositoryError("UNKNOWN", "Root comment not found.");
    }

    assertQuerySucceeded("Failed to load comment replies", repliesResult.error);
    const replies = (repliesResult.data ?? []).map(mapComment);

    // If the root comment itself is a reply in a longer thread,
    // fetch all siblings using the root's threadId.
    if (rootComment.threadId && rootComment.threadId !== rootComment.id) {
      const { data: threadRepliesData, error: threadRepliesError } =
        await this.client
          .from("comments")
          .select()
          .eq("thread_id", rootComment.threadId)
          .neq("id", rootComment.threadId)
          .order("created_at", { ascending: true });

      assertQuerySucceeded("Failed to load thread replies", threadRepliesError);

      return {
        rootComment,
        replies: (threadRepliesData ?? []).map(mapComment),
        replyCount: (threadRepliesData ?? []).length,
      };
    }

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

    return comment.authorId === userId;
  }

  async canDeleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.getCommentById(commentId);
    if (!comment) {
      return false;
    }

    return comment.authorId === userId;
  }
}
