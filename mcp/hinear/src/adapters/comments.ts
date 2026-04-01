import { resolveSession } from "../lib/auth";
import { createMcpActorSupabaseClient } from "../lib/supabase";
import type { AddCommentInput } from "../schemas/comment";

function sanitizeCommentBody(body: string) {
  let sanitized = body.replace(/<[^>]*>/g, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");
  return sanitized.trim();
}

async function requireActor() {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  if (session.userId) {
    return {
      actorId: session.userId,
      supabase,
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(
      "Authentication required. Set HINEAR_MCP_ACCESS_TOKEN or HINEAR_MCP_USER_ID."
    );
  }

  return {
    actorId: user.id,
    supabase,
  };
}

export async function addComment(input: AddCommentInput) {
  const { actorId, supabase } = await requireActor();
  const body = sanitizeCommentBody(input.body);

  if (!body) {
    throw new Error("Comment body cannot be empty.");
  }

  if (body.length > 10_000) {
    throw new Error("Comment body cannot exceed 10000 characters.");
  }

  const { data: issueRow, error: issueError } = await supabase
    .from("issues")
    .select("id, project_id, identifier, assignee_id, created_by")
    .eq("id", input.issue_id)
    .maybeSingle();

  if (issueError) {
    throw new Error(`Failed to load issue: ${issueError.message}`);
  }

  if (!issueRow) {
    throw new Error("Issue not found.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", issueRow.project_id)
    .eq("user_id", actorId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      `Failed to verify project access: ${membershipError.message}`
    );
  }

  if (!membership) {
    throw new Error("Forbidden. The current user cannot access this project.");
  }

  let parentCommentId: string | null = null;
  let threadId: string | null = null;

  if (input.parent_comment_id) {
    const { data: parentComment, error: parentError } = await supabase
      .from("comments")
      .select("id, thread_id")
      .eq("id", input.parent_comment_id)
      .maybeSingle();

    if (parentError) {
      throw new Error(`Failed to load parent comment: ${parentError.message}`);
    }

    if (!parentComment) {
      throw new Error("Parent comment not found.");
    }

    parentCommentId = parentComment.id;
    threadId = parentComment.thread_id ?? parentComment.id;
  }

  const { data: commentRow, error: commentError } = await supabase
    .from("comments")
    .insert({
      author_id: actorId,
      body,
      issue_id: issueRow.id,
      parent_comment_id: parentCommentId,
      project_id: issueRow.project_id,
      thread_id: threadId,
    })
    .select("id, created_at, updated_at, parent_comment_id, thread_id")
    .single();

  if (commentError) {
    throw new Error(`Failed to create comment: ${commentError.message}`);
  }

  const { error: activityError } = await supabase.from("activity_logs").insert({
    actor_id: actorId,
    field: null,
    from_value: null,
    issue_id: issueRow.id,
    project_id: issueRow.project_id,
    summary: "댓글을 남겼습니다",
    to_value: null,
    type: "issue.comment.created",
  });

  if (activityError) {
    throw new Error(`Failed to append activity log: ${activityError.message}`);
  }

  return {
    comment: {
      created_at: commentRow.created_at,
      id: commentRow.id,
      issue_id: issueRow.id,
      parent_comment_id: commentRow.parent_comment_id ?? null,
      thread_id: commentRow.thread_id ?? null,
      updated_at: commentRow.updated_at ?? null,
    },
    summary: `Added a comment to ${issueRow.identifier}.`,
    user_id: actorId,
  };
}
