import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Issue } from "@/features/issues/types";

const {
  getIssueByIdMock,
  getAuthenticatedActorIdOrNullMock,
  getServerIssuesRepositoryMock,
  updateIssueMock,
} = vi.hoisted(() => ({
  getIssueByIdMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  getServerIssuesRepositoryMock: vi.fn(),
  updateIssueMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: getServerIssuesRepositoryMock,
}));

import { PUT } from "@/app/internal/issues/[issueId]/route";

describe("PUT /internal/issues/[issueId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request has no authenticated actor", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await PUT(
      new Request("https://hinear.test/internal", {
        method: "PUT",
        body: JSON.stringify({ status: "Done" }),
      }),
      {
        params: Promise.resolve({ issueId: "issue-1" }),
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: "AUTH_REQUIRED",
      error: "Authentication required.",
    });
  });

  it("rejects unsupported payloads", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await PUT(
      new Request("https://hinear.test/internal", {
        method: "PUT",
        body: JSON.stringify({ labels: ["ui"] }),
      }),
      {
        params: Promise.resolve({ issueId: "issue-1" }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_ISSUE_UPDATE",
      error: "No supported issue fields were provided.",
    });
  });

  it("rejects blank titles", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await PUT(
      new Request("https://hinear.test/internal", {
        method: "PUT",
        body: JSON.stringify({ title: "   " }),
      }),
      {
        params: Promise.resolve({ issueId: "issue-1" }),
      }
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_TITLE",
      error: "Issue title is required.",
    });
  });

  it("updates the issue and returns the board contract shape", async () => {
    const issue: Issue = {
      id: "issue-1",
      projectId: "project-1",
      issueNumber: 5,
      identifier: "WEB-5",
      title: "Finish auth rollout",
      status: "Done",
      priority: "High",
      assigneeId: null,
      labels: [{ id: "label-1", name: "Auth", color: "#2563EB" }],
      description: "All routes now use request-bound auth.",
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-20T00:00:00.000Z",
      updatedAt: "2026-03-20T01:00:00.000Z",
      version: 3,
    };

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      getIssueById: getIssueByIdMock,
      updateIssue: updateIssueMock,
    });
    getIssueByIdMock.mockResolvedValue(issue);
    updateIssueMock.mockResolvedValue(issue);

    const response = await PUT(
      new Request("https://hinear.test/internal", {
        method: "PUT",
        body: JSON.stringify({ status: "Done" }),
      }),
      {
        params: Promise.resolve({ issueId: "issue-1" }),
      }
    );

    expect(updateIssueMock).toHaveBeenCalledWith("issue-1", {
      status: "Done",
      updatedBy: "user-1",
      version: 3,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      issue: {
        id: "issue-1",
        identifier: "WEB-5",
        title: "Finish auth rollout",
        status: "Done",
        priority: "High",
        assignee: null,
        labels: [{ id: "label-1", name: "Auth", color: "#2563EB" }],
        description: "All routes now use request-bound auth.",
        comments: [],
        activityLog: [],
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T01:00:00.000Z",
      },
    });
  });

  it("returns 403 when the repository reports a permission failure", async () => {
    const issue: Issue = {
      id: "issue-1",
      projectId: "project-1",
      issueNumber: 5,
      identifier: "WEB-5",
      title: "Finish auth rollout",
      status: "Done",
      priority: "High",
      assigneeId: null,
      labels: [],
      description: "All routes now use request-bound auth.",
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-20T00:00:00.000Z",
      updatedAt: "2026-03-20T01:00:00.000Z",
      version: 3,
    };

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      getIssueById: getIssueByIdMock,
      updateIssue: updateIssueMock,
    });
    getIssueByIdMock.mockResolvedValue(issue);
    updateIssueMock.mockRejectedValue(
      new Error(
        "Failed to update issue: new row violates row-level security policy"
      )
    );

    const response = await PUT(
      new Request("https://hinear.test/internal", {
        method: "PUT",
        body: JSON.stringify({ status: "Done" }),
      }),
      {
        params: Promise.resolve({ issueId: "issue-1" }),
      }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      error:
        "Failed to update issue: new row violates row-level security policy",
    });
  });
});
