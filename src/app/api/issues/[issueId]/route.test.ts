import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadIssueDrawerDetailMock } = vi.hoisted(() => ({
  loadIssueDrawerDetailMock: vi.fn(),
}));

vi.mock("@/features/issues/lib/issue-drawer-loader", () => ({
  loadIssueDrawerDetail: loadIssueDrawerDetailMock,
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
    loadIssueDrawerDetailMock.mockResolvedValue({
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

    expect(loadIssueDrawerDetailMock).toHaveBeenCalledWith(
      "project-1",
      "issue-1"
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
