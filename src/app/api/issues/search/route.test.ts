import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  checkProjectAccessMock,
  createRequestSupabaseServerClientMock,
  filterIssuesMock,
  getAuthenticatedActorIdOrNullMock,
  searchIssuesMock,
  supabaseFromMock,
} = vi.hoisted(() => ({
  checkProjectAccessMock: vi.fn(),
  createRequestSupabaseServerClientMock: vi.fn(),
  filterIssuesMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  searchIssuesMock: vi.fn(),
  supabaseFromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

vi.mock(
  "@/features/projects/repositories/supabase-projects-repository",
  () => ({
    SupabaseProjectsRepository: class {
      checkProjectAccess = checkProjectAccessMock;
    },
  })
);

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: vi.fn().mockResolvedValue({
    filterIssues: filterIssuesMock,
    searchIssues: searchIssuesMock,
  }),
}));

import { POST } from "@/app/api/issues/search/route";

describe("POST /api/issues/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRequestSupabaseServerClientMock.mockResolvedValue({
      from: supabaseFromMock,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await POST(
      new Request("https://hinear.test/api/issues/search", {
        method: "POST",
        body: JSON.stringify({ projectId: "project-1", query: "bug" }),
      }) as never
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("returns 400 for invalid payload", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("https://hinear.test/api/issues/search", {
        method: "POST",
        body: JSON.stringify({ projectId: "project-1" }),
      }) as never
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "projectId and at least one search or filter field are required",
    });
  });

  it("returns 403 when the actor cannot access the project", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    checkProjectAccessMock.mockResolvedValue(false);

    const response = await POST(
      new Request("https://hinear.test/api/issues/search", {
        method: "POST",
        body: JSON.stringify({ projectId: "project-1", query: "bug" }),
      }) as never
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Forbidden",
    });
  });

  it("returns mapped board issues for a valid search", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    checkProjectAccessMock.mockResolvedValue(true);
    searchIssuesMock.mockResolvedValue([
      {
        id: "issue-1",
        projectId: "project-1",
        issueNumber: 12,
        identifier: "WEB-12",
        title: "Search result",
        status: "Todo",
        priority: "Medium",
        assigneeId: "user-2",
        labels: [{ id: "label-1", name: "Bug", color: "#f00" }],
        description: "desc",
        dueDate: null,
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: "2026-03-25T00:00:00.000Z",
        updatedAt: "2026-03-25T01:00:00.000Z",
        version: 1,
      },
    ]);
    supabaseFromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [
            {
              id: "user-2",
              display_name: "담당자",
              avatar_url: null,
            },
          ],
          error: null,
        }),
      }),
    });

    const response = await POST(
      new Request("https://hinear.test/api/issues/search", {
        method: "POST",
        body: JSON.stringify({ projectId: "project-1", query: "bug" }),
      }) as never
    );

    expect(searchIssuesMock).toHaveBeenCalledWith({
      limit: 50,
      projectId: "project-1",
      query: "bug",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      issues: [
        {
          id: "issue-1",
          identifier: "WEB-12",
          title: "Search result",
          status: "Todo",
          priority: "Medium",
          assignee: {
            id: "user-2",
            name: "담당자",
            avatarUrl: null,
          },
          labels: [{ id: "label-1", name: "Bug", color: "#f00" }],
          issueNumber: 12,
          projectId: "project-1",
          dueDate: null,
          createdAt: "2026-03-25T00:00:00.000Z",
          updatedAt: "2026-03-25T01:00:00.000Z",
        },
      ],
      total: 1,
    });
  });

  it("uses repository filters when advanced filters are provided", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    checkProjectAccessMock.mockResolvedValue(true);
    filterIssuesMock.mockResolvedValue([]);

    const response = await POST(
      new Request("https://hinear.test/api/issues/search", {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-1",
          query: "bug",
          statuses: ["Todo"],
          priorities: ["High"],
          assigneeIds: ["user-2"],
          labelIds: ["label-1"],
        }),
      }) as never
    );

    expect(filterIssuesMock).toHaveBeenCalledWith({
      limit: 50,
      projectId: "project-1",
      searchQuery: "bug",
      statuses: ["Todo"],
      priorities: ["High"],
      assigneeIds: ["user-2"],
      labelIds: ["label-1"],
    });
    expect(searchIssuesMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      issues: [],
      total: 0,
    });
  });

  it("clamps limit before forwarding to repositories", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    checkProjectAccessMock.mockResolvedValue(true);
    searchIssuesMock.mockResolvedValue([]);

    const response = await POST(
      new Request("https://hinear.test/api/issues/search", {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-1",
          query: "bug",
          limit: 999,
        }),
      }) as never
    );

    expect(searchIssuesMock).toHaveBeenCalledWith({
      limit: 100,
      projectId: "project-1",
      query: "bug",
    });
    expect(response.status).toBe(200);
  });
});
