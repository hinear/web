import { NextResponse } from "next/server";
import {
  getMutationErrorStatus,
  inferMutationErrorCode,
} from "@/features/issues/lib/mutation-error-messages";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { triggerCommentAddedNotification } from "@/lib/notifications/triggers";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

interface RouteContext {
  params: Promise<{
    issueId: string;
  }>;
}

function parseCommentBody(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const value = (body as Record<string, unknown>).body;

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const { issueId } = await context.params;
    const repository = await getServerIssuesRepository();
    const comments = await repository.listCommentsByIssueId(issueId);

    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json(
      {
        code: "COMMENTS_LOAD_ERROR",
        error:
          error instanceof Error ? error.message : "Failed to load comments",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", error: "Authentication required." },
      { status: 401 }
    );
  }

  const commentBody = parseCommentBody(await request.json().catch(() => null));

  if (!commentBody) {
    return NextResponse.json(
      { code: "INVALID_COMMENT_BODY", error: "Comment body is required." },
      { status: 422 }
    );
  }

  try {
    const { issueId } = await context.params;
    const repository = await getServerIssuesRepository();
    const issue = await repository.getIssueById(issueId);

    if (!issue) {
      return NextResponse.json(
        { code: "ISSUE_NOT_FOUND", error: "Issue not found." },
        { status: 404 }
      );
    }

    const comment = await repository.createComment({
      issueId,
      projectId: issue.projectId,
      authorId: actorId,
      body: commentBody,
    });
    const activityEntry = await repository.appendActivityLog({
      issueId,
      projectId: issue.projectId,
      actorId,
      type: "issue.comment.created",
      field: null,
      from: null,
      to: null,
      summary: "댓글을 남겼습니다",
    });

    triggerCommentAddedNotification({
      issueId,
      issueIdentifier: issue.identifier,
      projectId: issue.projectId,
      commentId: comment.id,
      commentAuthor: actorId,
      commentPreview: comment.body.slice(0, 120),
      actor: {
        id: actorId,
        name: "사용자",
      },
      targetUserIds: [issue.assigneeId, issue.createdBy].filter(
        (userId): userId is string => Boolean(userId && userId !== actorId)
      ),
    }).catch((err) => {
      console.error("[Notification] Failed to send comment notification:", err);
    });

    return NextResponse.json(
      {
        activityEntry,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create comment.";
    const code = inferMutationErrorCode(error);
    const status = getMutationErrorStatus(code);

    return NextResponse.json({ code, error: message }, { status });
  }
}
