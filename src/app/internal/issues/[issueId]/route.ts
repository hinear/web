import { NextResponse } from "next/server";
import { loadIssueDetailContainer } from "@/features/issues/containers/load-issue-detail-container";
import { toBoardIssue } from "@/features/issues/lib/issue-contract-adapter";
import {
  getMutationErrorStatus,
  inferMutationErrorCode,
} from "@/features/issues/lib/mutation-error-messages";
import { IssueDetailPresenter } from "@/features/issues/presenters/issue-detail-presenter";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import type { Issue } from "@/features/issues/types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";
import {
  triggerIssueAssignedNotification,
  triggerIssueStatusChangedNotification,
} from "@/lib/notifications/triggers";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface RouteContext {
  params: Promise<{
    issueId: string;
  }>;
}

type IssueUpdateBody = Partial<
  Pick<Issue, "assigneeId" | "description" | "priority" | "status" | "title">
>;

function parseIssueUpdateBody(body: unknown): IssueUpdateBody {
  if (!body || typeof body !== "object") {
    return {};
  }

  const record = body as Record<string, unknown>;
  const updates: IssueUpdateBody = {};

  if (typeof record.title === "string") {
    updates.title = record.title;
  }

  if (
    typeof record.status === "string" &&
    ISSUE_STATUSES.includes(record.status as Issue["status"])
  ) {
    updates.status = record.status as Issue["status"];
  }

  if (
    typeof record.priority === "string" &&
    ISSUE_PRIORITIES.includes(record.priority as Issue["priority"])
  ) {
    updates.priority = record.priority as Issue["priority"];
  }

  if (typeof record.description === "string") {
    updates.description = record.description;
  }

  if (typeof record.assigneeId === "string" || record.assigneeId === null) {
    updates.assigneeId = record.assigneeId;
  }

  return updates;
}

export async function GET(_request: Request, context: RouteContext) {
  // 인증 체크
  const actorId = await getAuthenticatedActorIdOrNull();
  if (!actorId) {
    return IssueDetailPresenter.presentAuthRequired();
  }

  const { issueId } = await context.params;
  const supabase = await createRequestSupabaseServerClient();

  // Container: 데이터 페칭
  const result = await loadIssueDetailContainer(supabase, issueId);

  if (result.error) {
    // Presenter: 에러 응답
    return IssueDetailPresenter.presentError(result.error);
  }

  // Presenter: 성공 응답
  if (!result.data) {
    return IssueDetailPresenter.presentError(
      new Error("Failed to load issue detail")
    );
  }

  return IssueDetailPresenter.presentSuccess(result.data);
}

export async function PUT(request: Request, context: RouteContext) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return NextResponse.json(
      {
        code: "AUTH_REQUIRED",
        error: "Authentication required.",
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const updates = parseIssueUpdateBody(body);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      {
        code: "INVALID_ISSUE_UPDATE",
        error: "No supported issue fields were provided.",
      },
      { status: 400 }
    );
  }

  if (updates.title !== undefined && updates.title.trim().length === 0) {
    return NextResponse.json(
      { code: "INVALID_TITLE", error: "Issue title is required." },
      { status: 422 }
    );
  }

  try {
    const { issueId } = await context.params;
    const repository = await getServerIssuesRepository();
    const currentIssue = await repository.getIssueById(issueId);

    if (!currentIssue) {
      return NextResponse.json(
        { code: "ISSUE_NOT_FOUND", error: "Issue not found." },
        { status: 404 }
      );
    }

    const issue = await repository.updateIssue(issueId, {
      ...updates,
      updatedBy: actorId,
      version: currentIssue.version,
    });
    const supabase = await createRequestSupabaseServerClient();
    const assignee =
      issue.assigneeId === null
        ? null
        : await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", issue.assigneeId)
            .maybeSingle()
            .then(({ data }) =>
              data
                ? {
                    avatarUrl: data.avatar_url,
                    name: data.display_name?.trim() || data.id,
                  }
                : null
            );

    // 알림 전송 (비동기, 블로킹하지 않음)
    if (updates.status && updates.status !== currentIssue.status) {
      // 상태 변경 알림
      triggerIssueStatusChangedNotification({
        issueId: issue.id,
        issueIdentifier: issue.identifier,
        projectId: issue.projectId,
        previousStatus: currentIssue.status,
        newStatus: updates.status,
        actor: {
          id: actorId,
          name: "사용자", // TODO: 실제 사용자 이름으로 변경
        },
      }).catch((err) => {
        console.error(
          "[Notification] Failed to send status change notification:",
          err
        );
      });
    }

    if (
      updates.assigneeId !== undefined &&
      updates.assigneeId !== currentIssue.assigneeId
    ) {
      // 할당 변경 알림
      triggerIssueAssignedNotification({
        issueId: issue.id,
        issueIdentifier: issue.identifier,
        projectId: issue.projectId,
        actor: {
          id: actorId,
          name: "사용자", // TODO: 실제 사용자 이름으로 변경
        },
      }).catch((err) => {
        console.error(
          "[Notification] Failed to send assignment notification:",
          err
        );
      });
    }

    return NextResponse.json({
      issue: toBoardIssue(issue, assignee),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update issue.";
    const code = inferMutationErrorCode(error);
    const status = getMutationErrorStatus(code);

    return NextResponse.json(
      {
        code,
        error: message,
      },
      { status }
    );
  }
}
