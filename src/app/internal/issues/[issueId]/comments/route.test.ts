import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ActivityLogEntry, Comment, Issue } from "@/features/issues/types";

const {
  appendActivityLogMock,
  createCommentMock,
  getAuthenticatedActorIdOrNullMock,
  getIssueByIdMock,
  getServerIssuesRepositoryMock,
  triggerCommentAddedNotificationMock,
} = vi.hoisted(() => ({
  appendActivityLogMock: vi.fn(),
  createCommentMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  getIssueByIdMock: vi.fn(),
  getServerIssuesRepositoryMock: vi.fn(),
  triggerCommentAddedNotificationMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/comments/containers/load-comments-container", () => ({
  loadCommentsContainer: vi.fn(),
}));

vi.mock("@/features/comments/presenters/comments-presenter", () => ({
  CommentsPresenter: {
    presentSuccess: vi.fn(),
    presentAuthRequired: vi.fn(),
    presentError: vi.fn(),
  },
}));

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: getServerIssuesRepositoryMock,
}));

vi.mock("@/lib/notifications/triggers", () => ({
  triggerCommentAddedNotification: triggerCommentAddedNotificationMock,
}));

import { POST } from "@/app/internal/issues/[issueId]/comments/route";

describe("POST /internal/issues/[issueId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    triggerCommentAddedNotificationMock.mockResolvedValue(undefined);
  });

  it("rejects empty comments", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("https://hinear.test/internal", {
        method: "POST",
        body: JSON.stringify({ body: "   " }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_COMMENT_BODY",
      error: "Comment body is required.",
    });
  });

  it("creates a comment and matching activity entry", async () => {
    const issue: Issue = {
      id: "issue-1",
      projectId: "project-1",
      issueNumber: 2,
      identifier: "WEB-2",
      title: "Comment support",
      status: "Todo",
      priority: "Medium",
      assigneeId: null,
      labels: [],
      description: "",
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-20T00:00:00.000Z",
      updatedAt: "2026-03-20T00:00:00.000Z",
      dueDate: null,
      version: 1,
    };
    const comment: Comment = {
      id: "comment-1",
      issueId: "issue-1",
      projectId: "project-1",
      authorId: "user-1",
      body: "Looks good.",
      createdAt: "2026-03-20T02:00:00.000Z",
    };
    const activityEntry: ActivityLogEntry = {
      id: "activity-1",
      issueId: "issue-1",
      projectId: "project-1",
      actorId: "user-1",
      type: "issue.comment.created",
      field: null,
      from: null,
      to: null,
      summary: "댓글을 남겼습니다",
      createdAt: "2026-03-20T02:00:00.000Z",
    };

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      appendActivityLog: appendActivityLogMock,
      createComment: createCommentMock,
      getIssueById: getIssueByIdMock,
    });
    getIssueByIdMock.mockResolvedValue(issue);
    createCommentMock.mockResolvedValue(comment);
    appendActivityLogMock.mockResolvedValue(activityEntry);

    const response = await POST(
      new Request("https://hinear.test/internal", {
        method: "POST",
        body: JSON.stringify({ body: "Looks good." }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(createCommentMock).toHaveBeenCalledWith({
      authorId: "user-1",
      body: "Looks good.",
      issueId: "issue-1",
      projectId: "project-1",
    });
    expect(triggerCommentAddedNotificationMock).toHaveBeenCalledWith({
      actor: {
        id: "user-1",
        name: "사용자",
      },
      commentAuthor: "user-1",
      commentId: "comment-1",
      commentPreview: "Looks good.",
      issueId: "issue-1",
      issueIdentifier: "WEB-2",
      projectId: "project-1",
      targetUserIds: [],
    });
    await expect(response.json()).resolves.toEqual({
      activityEntry,
      comment,
    });
  });

  it("returns 404 when the issue no longer exists", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      appendActivityLog: appendActivityLogMock,
      createComment: createCommentMock,
      getIssueById: getIssueByIdMock,
    });
    getIssueByIdMock.mockResolvedValue(null);

    const response = await POST(
      new Request("https://hinear.test/internal", {
        method: "POST",
        body: JSON.stringify({ body: "Looks good." }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: "ISSUE_NOT_FOUND",
      error: "Issue not found.",
    });
  });
});
