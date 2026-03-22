import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Issue } from "@/features/issues/types";

const {
  getAuthenticatedActorIdOrNullMock,
  getServerIssuesRepositoryMock,
  listIssuesByProjectMock,
} = vi.hoisted(() => ({
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  getServerIssuesRepositoryMock: vi.fn(),
  listIssuesByProjectMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: getServerIssuesRepositoryMock,
}));

import { GET } from "@/app/internal/projects/[projectId]/issues/route";

describe("GET /internal/projects/[projectId]/issues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request has no authenticated actor", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await GET(new Request("https://hinear.test/internal"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: "AUTH_REQUIRED",
      error: "Authentication required.",
    });
  });

  it("returns project issues mapped to the board contract", async () => {
    const issues: Issue[] = [
      {
        id: "issue-1",
        projectId: "project-1",
        issueNumber: 12,
        identifier: "WEB-12",
        title: "Persist labels on board",
        status: "Todo",
        priority: "Medium",
        assigneeId: "user-1",
        labels: [{ id: "label-1", name: "Labels", color: "#16A34A" }],
        description: "",
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T01:00:00.000Z",
        version: 1,
      },
    ];

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      listIssuesByProject: listIssuesByProjectMock,
    });
    listIssuesByProjectMock.mockResolvedValue(issues);

    const response = await GET(new Request("https://hinear.test/internal"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(200);
    expect(listIssuesByProjectMock).toHaveBeenCalledWith("project-1");
    await expect(response.json()).resolves.toEqual({
      issues: [
        {
          id: "issue-1",
          identifier: "WEB-12",
          title: "Persist labels on board",
          status: "Todo",
          priority: "Medium",
          assignee: {
            id: "user-1",
            name: "Assigned",
          },
          labels: [{ id: "label-1", name: "Labels", color: "#16A34A" }],
          description: "",
          comments: [],
          activityLog: [],
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T01:00:00.000Z",
        },
      ],
      total: 1,
    });
  });

  it("returns a structured error payload when the repository throws", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getServerIssuesRepositoryMock.mockResolvedValue({
      listIssuesByProject: listIssuesByProjectMock,
    });
    listIssuesByProjectMock.mockRejectedValue(
      new Error(
        "Failed to load project issues: permission denied for table issues"
      )
    );

    const response = await GET(new Request("https://hinear.test/internal"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      error:
        "Failed to load project issues: permission denied for table issues",
    });
  });
});
