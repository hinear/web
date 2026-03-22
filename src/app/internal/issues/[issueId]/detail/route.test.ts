import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ActivityLogEntry, Issue } from "@/features/issues/types";

const {
  getAuthenticatedActorIdOrNullMock,
  getServerIssuesRepositoryMock,
  listActivityLogByIssueIdMock,
  updateIssueMock,
} = vi.hoisted(() => ({
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  getServerIssuesRepositoryMock: vi.fn(),
  listActivityLogByIssueIdMock: vi.fn(),
  updateIssueMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: getServerIssuesRepositoryMock,
}));

import { PATCH } from "@/app/internal/issues/[issueId]/detail/route";

describe("PATCH /internal/issues/[issueId]/detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await PATCH(
      new Request("https://hinear.test/internal", {
        method: "PATCH",
        body: JSON.stringify({ priority: "High" }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: "AUTH_REQUIRED",
      error: "Authentication required.",
    });
  });

  it("returns 422 when the title is blank", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("https://hinear.test/internal", {
        method: "PATCH",
        body: JSON.stringify({ title: "   ", version: 2 }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_TITLE",
      error: "Issue title is required.",
    });
  });

  it("returns updated issue detail payload", async () => {
    const issue: Issue = {
      id: "issue-1",
      projectId: "project-1",
      issueNumber: 1,
      identifier: "WEB-1",
      title: "Persist detail changes",
      status: "In Progress",
      priority: "High",
      assigneeId: "user-1",
      labels: [],
      description: "Description",
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-20T00:00:00.000Z",
      updatedAt: "2026-03-20T01:00:00.000Z",
      version: 2,
    };
    const activityLog: ActivityLogEntry[] = [
      {
        id: "activity-1",
        issueId: "issue-1",
        projectId: "project-1",
        actorId: "user-1",
        type: "issue.priority.updated",
        field: "priority",
        from: "Medium",
        to: "High",
        summary: "우선순위를 업데이트했습니다",
        createdAt: "2026-03-20T01:00:00.000Z",
      },
    ];

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      listActivityLogByIssueId: listActivityLogByIssueIdMock,
      updateIssue: updateIssueMock,
    });
    updateIssueMock.mockResolvedValue(issue);
    listActivityLogByIssueIdMock.mockResolvedValue(activityLog);

    const response = await PATCH(
      new Request("https://hinear.test/internal", {
        method: "PATCH",
        body: JSON.stringify({ priority: "High", version: 2 }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(updateIssueMock).toHaveBeenCalledWith("issue-1", {
      priority: "High",
      updatedBy: "user-1",
      version: 2,
    });
    await expect(response.json()).resolves.toEqual({
      activityLog,
      issue,
    });
  });

  it("returns 409 when the repository reports a conflict", async () => {
    const conflictError = {
      type: "CONFLICT",
      message: "This issue has changed since you loaded it.",
      requestedVersion: 1,
      currentVersion: 2,
      currentIssue: {
        id: "issue-1",
        projectId: "project-1",
        issueNumber: 1,
        identifier: "WEB-1",
        title: "Latest title",
        status: "Done",
        priority: "High",
        assigneeId: null,
        labels: [],
        description: "",
        createdBy: "user-1",
        updatedBy: "user-2",
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T02:00:00.000Z",
        version: 2,
      },
    };

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      listActivityLogByIssueId: listActivityLogByIssueIdMock,
      updateIssue: updateIssueMock,
    });
    updateIssueMock.mockRejectedValue(conflictError);

    const response = await PATCH(
      new Request("https://hinear.test/internal", {
        method: "PATCH",
        body: JSON.stringify({ title: "Stale title", version: 1 }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(conflictError);
  });

  it("returns 403 when the repository reports a permission failure", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      listActivityLogByIssueId: listActivityLogByIssueIdMock,
      updateIssue: updateIssueMock,
    });
    updateIssueMock.mockRejectedValue(
      new Error(
        "Failed to update issue: new row violates row-level security policy"
      )
    );

    const response = await PATCH(
      new Request("https://hinear.test/internal", {
        method: "PATCH",
        body: JSON.stringify({ title: "Blocked", version: 1 }),
      }),
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      error:
        "Failed to update issue: new row violates row-level security policy",
    });
  });
});
