import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createIssue: vi.fn(),
  listIssuesCursorPage: vi.fn(),
  repositoryFactory: vi.fn(),
  requireApiActorId: vi.fn(),
  requireProjectAccess: vi.fn(),
}));

vi.mock("@/app/api/_lib/auth", () => ({
  requireApiActorId: mocks.requireApiActorId,
  requireProjectAccess: mocks.requireProjectAccess,
}));

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: mocks.repositoryFactory,
}));

import { GET, POST } from "@/app/api/v1/projects/[projectId]/issues/route";
import { createRouteContext, readJson } from "@/test/api-route-helpers";

describe("/api/v1/projects/[projectId]/issues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiActorId.mockResolvedValue("user-1");
    mocks.requireProjectAccess.mockResolvedValue(undefined);
    mocks.repositoryFactory.mockResolvedValue({
      createIssue: mocks.createIssue,
      listIssuesCursorPage: mocks.listIssuesCursorPage,
    });
  });

  it("GET returns cursor pagination payload", async () => {
    mocks.listIssuesCursorPage.mockResolvedValue({
      hasMore: false,
      issues: [
        {
          createdAt: "2026-03-27T10:00:00Z",
          description: "Desc",
          id: "issue-1",
          identifier: "AAA-1",
          priority: "Medium",
          projectId: "project-1",
          status: "Triage",
          title: "Issue 1",
          updatedAt: "2026-03-27T10:00:00Z",
          version: 1,
        },
      ],
    });

    const response = await GET(
      new Request(
        "https://hinear.test/api/v1/projects/project-1/issues?limit=20"
      ),
      createRouteContext({ projectId: "project-1" })
    );

    expect(response.status).toBe(200);
    await expect(readJson<any>(response)).resolves.toMatchObject({
      success: true,
      data: {
        items: [{ id: "issue-1" }],
        pagination: {
          hasMore: false,
          limit: 20,
        },
      },
    });
    expect(mocks.listIssuesCursorPage).toHaveBeenCalledWith({
      after: undefined,
      limit: 20,
      priority: undefined,
      projectId: "project-1",
      status: undefined,
    });
  });

  it("GET forwards filters and decoded cursor to repository", async () => {
    mocks.listIssuesCursorPage.mockResolvedValue({
      hasMore: false,
      issues: [],
    });
    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: "2026-03-27T10:00:00Z",
        id: "issue-9",
      })
    ).toString("base64url");

    await GET(
      new Request(
        `https://hinear.test/api/v1/projects/project-1/issues?status=Triage&limit=20&cursor=${cursor}`
      ),
      createRouteContext({ projectId: "project-1" })
    );

    expect(mocks.listIssuesCursorPage).toHaveBeenCalledWith({
      after: {
        createdAt: "2026-03-27T10:00:00Z",
        id: "issue-9",
      },
      limit: 20,
      priority: undefined,
      projectId: "project-1",
      status: "Triage",
    });
  });

  it("POST creates issue", async () => {
    mocks.createIssue.mockResolvedValue({
      createdAt: "2026-03-27T10:00:00Z",
      description: "",
      id: "issue-1",
      identifier: "AAA-1",
      priority: "Medium",
      projectId: "project-1",
      status: "Triage",
      title: "Issue 1",
      updatedAt: "2026-03-27T10:00:00Z",
      version: 1,
    });

    const response = await POST(
      new Request("https://hinear.test/api/v1/projects/project-1/issues", {
        body: JSON.stringify({
          title: "Issue 1",
        }),
        method: "POST",
      }),
      createRouteContext({ projectId: "project-1" })
    );

    expect(response.status).toBe(201);
    expect(mocks.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: "user-1",
        projectId: "project-1",
        title: "Issue 1",
      })
    );
  });
});
