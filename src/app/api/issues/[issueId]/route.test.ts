import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadIssueDetailMock } = vi.hoisted(() => ({
  loadIssueDetailMock: vi.fn(),
}));

vi.mock("@/features/issues/lib/issue-detail-loader", () => ({
  loadIssueDetail: loadIssueDetailMock,
}));

import { GET } from "@/app/api/issues/[issueId]/route";

describe("GET /api/issues/[issueId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when projectId is missing", async () => {
    const response = await GET(
      new Request("https://hinear.test/api/issues/issue-1") as never,
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "projectId is required",
    });
  });

  it("returns success-wrapped issue detail payload", async () => {
    loadIssueDetailMock.mockResolvedValue({
      issue: { id: "issue-1", title: "Detail", projectId: "project-1" },
      activityLog: [],
      availableLabels: [],
      assigneeOptions: [],
      memberNamesById: {},
    });

    const response = await GET(
      new Request(
        "https://hinear.test/api/issues/issue-1?projectId=project-1"
      ) as never,
      { params: Promise.resolve({ issueId: "issue-1" }) }
    );

    expect(loadIssueDetailMock).toHaveBeenCalledWith(
      "project-1",
      "issue-1",
      "/projects/project-1?issueId=issue-1"
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      issue: { id: "issue-1", title: "Detail", projectId: "project-1" },
      activityLog: [],
      availableLabels: [],
      assigneeOptions: [],
      memberNamesById: {},
    });
  });
});
