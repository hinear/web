import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getIssueByIdMock,
  getAuthenticatedActorIdOrNullMock,
  getServerIssuesRepositoryMock,
  revalidatePathMock,
  updateIssueMock,
} = vi.hoisted(() => ({
  getIssueByIdMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  getServerIssuesRepositoryMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  updateIssueMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: getServerIssuesRepositoryMock,
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

import { batchUpdateIssuesAction } from "@/features/issues/actions/batch-update-issues-action";

describe("batchUpdateIssuesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerIssuesRepositoryMock.mockResolvedValue({
      getIssueById: getIssueByIdMock,
      updateIssue: updateIssueMock,
    });
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
  });

  it("updates each issue using the latest stored version", async () => {
    getIssueByIdMock
      .mockResolvedValueOnce({
        id: "issue-1",
        version: 3,
      })
      .mockResolvedValueOnce({
        id: "issue-2",
        version: 8,
      });
    updateIssueMock.mockResolvedValue({});

    const result = await batchUpdateIssuesAction({
      projectId: "project-1",
      updates: [
        { issueId: "issue-1", status: "Done" },
        { assigneeId: "user-9", issueId: "issue-2" },
      ],
    });

    expect(updateIssueMock).toHaveBeenNthCalledWith(1, "issue-1", {
      assigneeId: undefined,
      priority: undefined,
      status: "Done",
      updatedBy: "user-1",
      version: 3,
    });
    expect(updateIssueMock).toHaveBeenNthCalledWith(2, "issue-2", {
      assigneeId: "user-9",
      priority: undefined,
      status: undefined,
      updatedBy: "user-1",
      version: 8,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects/project-1");
    expect(result).toEqual({
      errors: [],
      success: true,
      updated: [
        { issueId: "issue-1", success: true },
        { issueId: "issue-2", success: true },
      ],
    });
  });

  it("reports missing issues without aborting the batch", async () => {
    getIssueByIdMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "issue-2",
      version: 5,
    });
    updateIssueMock.mockResolvedValue({});

    const result = await batchUpdateIssuesAction({
      projectId: "project-1",
      updates: [
        { issueId: "missing-issue", priority: "High" },
        { issueId: "issue-2", priority: "Low" },
      ],
    });

    expect(updateIssueMock).toHaveBeenCalledTimes(1);
    expect(updateIssueMock).toHaveBeenCalledWith("issue-2", {
      assigneeId: undefined,
      priority: "Low",
      status: undefined,
      updatedBy: "user-1",
      version: 5,
    });
    expect(result).toEqual({
      errors: ["Issue missing-issue not found"],
      success: false,
      updated: [
        {
          error: "Issue not found",
          issueId: "missing-issue",
          success: false,
        },
        {
          issueId: "issue-2",
          success: true,
        },
      ],
    });
  });

  it("collects repository errors and continues processing later updates", async () => {
    getIssueByIdMock
      .mockResolvedValueOnce({
        id: "issue-1",
        version: 2,
      })
      .mockResolvedValueOnce({
        id: "issue-2",
        version: 4,
      });
    updateIssueMock
      .mockRejectedValueOnce(new Error("conflict detected"))
      .mockResolvedValueOnce({});

    const result = await batchUpdateIssuesAction({
      projectId: "project-1",
      updates: [
        { issueId: "issue-1", status: "In Progress" },
        { issueId: "issue-2", status: "Done" },
      ],
    });

    expect(updateIssueMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      errors: ["Issue issue-1: conflict detected"],
      success: false,
      updated: [
        {
          error: "conflict detected",
          issueId: "issue-1",
          success: false,
        },
        {
          issueId: "issue-2",
          success: true,
        },
      ],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects/project-1");
  });
});
