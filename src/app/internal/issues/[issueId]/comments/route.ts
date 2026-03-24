import { NextResponse } from "next/server";
import { loadCommentsContainer } from "@/features/comments/containers/load-comments-container";
import { CommentsPresenter } from "@/features/comments/presenters/comments-presenter";
import {
  getMutationErrorStatus,
  inferMutationErrorCode,
} from "@/features/issues/lib/mutation-error-messages";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

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
    return CommentsPresenter.presentAuthRequired();
  }

  const { issueId } = await context.params;
  const supabase = await createRequestSupabaseServerClient();

  const result = await loadCommentsContainer(supabase, issueId);

  if (result.error) {
    return CommentsPresenter.presentError(result.error);
  }

  if (!result.data) {
    return CommentsPresenter.presentError(new Error("Failed to load comments"));
  }

  return CommentsPresenter.presentSuccess(result.data);
}

export async function POST(request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return CommentsPresenter.presentAuthRequired();
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
