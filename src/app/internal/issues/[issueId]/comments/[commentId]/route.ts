import { NextResponse } from "next/server";
import {
  getMutationErrorStatus,
  inferMutationErrorCode,
} from "@/features/issues/lib/mutation-error-messages";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

interface RouteContext {
  params: Promise<{
    issueId: string;
    commentId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const { commentId } = await context.params;
    const body = await request.json();

    if (typeof body.body !== "string" || body.body.trim().length === 0) {
      return NextResponse.json(
        { code: "INVALID_COMMENT_BODY", error: "Comment body is required." },
        { status: 422 }
      );
    }

    const repository = await getServerIssuesRepository();
    const comment = await repository.getCommentById(commentId);

    if (!comment) {
      return NextResponse.json(
        { code: "COMMENT_NOT_FOUND", error: "Comment not found." },
        { status: 404 }
      );
    }

    if (comment.authorId !== actorId) {
      return NextResponse.json(
        { code: "FORBIDDEN", error: "You can only edit your own comments." },
        { status: 403 }
      );
    }

    const updatedComment = await repository.updateComment(commentId, {
      body: body.body.trim(),
    });

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update comment.";
    const code = inferMutationErrorCode(error);
    const status = getMutationErrorStatus(code);

    return NextResponse.json({ code, error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const { commentId } = await context.params;
    const repository = await getServerIssuesRepository();
    const comment = await repository.getCommentById(commentId);

    if (!comment) {
      return NextResponse.json(
        { code: "COMMENT_NOT_FOUND", error: "Comment not found." },
        { status: 404 }
      );
    }

    if (comment.authorId !== actorId) {
      return NextResponse.json(
        { code: "FORBIDDEN", error: "You can only delete your own comments." },
        { status: 403 }
      );
    }

    await repository.deleteComment(commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete comment.";
    const code = inferMutationErrorCode(error);
    const status = getMutationErrorStatus(code);

    return NextResponse.json({ code, error: message }, { status });
  }
}
