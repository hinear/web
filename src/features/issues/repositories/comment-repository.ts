import type { CreateCommentInput } from "@/features/issues/contracts";
import {
  assertDataPresent,
  assertQuerySucceeded,
  mapComment,
} from "@/features/issues/repositories/issue-repository-helpers";
import type { Comment } from "@/features/issues/types";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";

export class SupabaseCommentRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .insert({
        issue_id: input.issueId,
        project_id: input.projectId,
        author_id: input.authorId,
        body: input.body,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create comment", error);

    return mapComment(assertDataPresent("Failed to create comment", data));
  }

  async getCommentById(commentId: string): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .select("id, issue_id, project_id, author_id, body, created_at")
      .eq("id", commentId)
      .single();

    assertQuerySucceeded("Failed to get comment", error);

    return mapComment(assertDataPresent("Failed to get comment", data));
  }

  async listCommentsByIssueId(issueId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from("comments")
      .select("id, issue_id, project_id, author_id, body, created_at")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    assertQuerySucceeded("Failed to list comments", error);

    return data ? data.map(mapComment) : [];
  }

  async updateComment(
    commentId: string,
    updates: { body: string }
  ): Promise<Comment> {
    console.log(
      "[updateComment] Updating comment:",
      commentId,
      "with body:",
      updates.body
    );

    const { data, error } = await this.client
      .from("comments")
      .update({ body: updates.body })
      .eq("id", commentId)
      .select()
      .single();

    console.log("[updateComment] Data:", data, "Error:", error);

    assertQuerySucceeded("Failed to update comment", error);

    return mapComment(assertDataPresent("Failed to update comment", data));
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.client
      .from("comments")
      .delete()
      .eq("id", commentId);

    assertQuerySucceeded("Failed to delete comment", error);
  }
}
