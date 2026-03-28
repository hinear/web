import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIssues } from "@/features/issues/hooks/useIssues";

describe("useIssues", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("loads the board issues endpoint when no search query is provided", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        issues: [
          {
            id: "issue-1",
            identifier: "WEB-1",
            title: "Board issue",
            status: "Todo",
            priority: "Medium",
            assignee: null,
            labels: [],
            issueNumber: 1,
            projectId: "project-1",
            dueDate: null,
            createdAt: "2026-03-25T00:00:00.000Z",
            updatedAt: "2026-03-25T00:00:00.000Z",
          },
        ],
      }),
    });

    const { result } = renderHook(() => useIssues("project-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith(
      "/internal/projects/project-1/issues"
    );
    expect(result.current.issues).toHaveLength(1);
  });

  it("uses the search API when a search query is provided", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        issues: [
          {
            id: "issue-2",
            identifier: "WEB-2",
            title: "Search issue",
            status: "Done",
            priority: "High",
            assignee: null,
            labels: [],
            issueNumber: 2,
            projectId: "project-1",
            dueDate: null,
            createdAt: "2026-03-25T00:00:00.000Z",
            updatedAt: "2026-03-25T00:00:00.000Z",
          },
        ],
      }),
    });

    const { result } = renderHook(() =>
      useIssues("project-1", { searchQuery: "bug" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/issues/search",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    expect(
      JSON.parse((fetchMock.mock.calls[0] ?? [])[1]?.body as string)
    ).toEqual({
      limit: 50,
      projectId: "project-1",
      query: "bug",
    });
    expect(result.current.issues).toHaveLength(1);
    expect(result.current.issues[0]?.identifier).toBe("WEB-2");
  });

  it("uses the search API when advanced filters are provided", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        issues: [],
      }),
    });

    const { result } = renderHook(() =>
      useIssues("project-1", {
        assigneeIds: ["user-1"],
        labelIds: ["label-1"],
        priorities: ["High"],
        statuses: ["Todo"],
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/issues/search",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    expect(
      JSON.parse((fetchMock.mock.calls[0] ?? [])[1]?.body as string)
    ).toEqual({
      assigneeIds: ["user-1"],
      labelIds: ["label-1"],
      limit: 50,
      priorities: ["High"],
      projectId: "project-1",
      statuses: ["Todo"],
    });
  });

  it("forwards a custom search limit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        issues: [],
      }),
    });

    const { result } = renderHook(() =>
      useIssues("project-1", { searchQuery: "bug", limit: 25 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(
      JSON.parse((fetchMock.mock.calls[0] ?? [])[1]?.body as string)
    ).toEqual({
      limit: 25,
      projectId: "project-1",
      query: "bug",
    });
  });

  it("tracks pending issue updates and prevents duplicate requests for the same issue", async () => {
    let resolveRequest: ((value: unknown) => void) | null = null;

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          issues: [],
        }),
      })
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );

    const { result } = renderHook(() => useIssues("project-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMock.mockClear();

    let firstRequest: Promise<unknown> | undefined;

    await act(async () => {
      firstRequest = result.current.updateIssue("issue-1", {
        status: "Done",
      });
    });

    await waitFor(() =>
      expect(result.current.pendingIssueIds).toEqual(["issue-1"])
    );

    let duplicateRequest: Promise<unknown> | undefined;

    await act(async () => {
      duplicateRequest = result.current.updateIssue("issue-1", {
        status: "Canceled",
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.isUpdatingIssues).toBe(true);
    await expect(duplicateRequest).resolves.toBeUndefined();

    await act(async () => {
      resolveRequest?.({
        ok: true,
        json: vi.fn().mockResolvedValue({
          issue: {
            id: "issue-1",
            identifier: "WEB-1",
            title: "Board issue",
            status: "Done",
            priority: "Medium",
            assigneeId: null,
            labels: [],
            issueNumber: 1,
            projectId: "project-1",
            description: "",
            createdBy: "user-1",
            updatedBy: "user-1",
            dueDate: null,
            createdAt: "2026-03-25T00:00:00.000Z",
            updatedAt: "2026-03-25T00:00:00.000Z",
            version: 1,
          },
        }),
      });
      await firstRequest;
    });

    await waitFor(() => {
      expect(result.current.pendingIssueIds).toEqual([]);
      expect(result.current.isUpdatingIssues).toBe(false);
    });
  });
});
