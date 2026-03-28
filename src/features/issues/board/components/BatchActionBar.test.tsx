import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { batchUpdateIssuesActionMock, toastErrorMock, toastSuccessMock } =
  vi.hoisted(() => ({
    batchUpdateIssuesActionMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
  }));

vi.mock("@/features/issues/actions/batch-update-issues-action", () => ({
  batchUpdateIssuesAction: batchUpdateIssuesActionMock,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

import { BatchActionBar } from "@/features/issues/board/components/BatchActionBar";

describe("BatchActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    batchUpdateIssuesActionMock.mockResolvedValue({
      success: true,
      updated: [
        { issueId: "issue-1", success: true },
        { issueId: "issue-2", success: true },
      ],
      errors: [],
    });
  });

  it("sends selected issue ids when changing status and clears selection on success", async () => {
    const user = userEvent.setup();
    const onClearSelection = vi.fn();

    render(
      <BatchActionBar
        assigneeOptions={[
          { label: "Assign to...", value: "" },
          { label: "최호", value: "user-1" },
        ]}
        onClearSelection={onClearSelection}
        projectId="project-1"
        selectedCount={2}
        selectedIssueIds={["issue-1", "issue-2"]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByRole("option", { name: "Done" }));

    await waitFor(() =>
      expect(batchUpdateIssuesActionMock).toHaveBeenCalledWith({
        projectId: "project-1",
        updates: [
          { issueId: "issue-1", status: "Done" },
          { issueId: "issue-2", status: "Done" },
        ],
      })
    );
    expect(toastSuccessMock).toHaveBeenCalledWith('Updated 2 issues to "Done"');
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  }, 15_000);

  it("shows an error toast when the batch update action fails", async () => {
    const user = userEvent.setup();

    batchUpdateIssuesActionMock.mockResolvedValue({
      success: false,
      updated: [
        { issueId: "issue-1", success: false, error: "Issue not found" },
      ],
      errors: ["Issue issue-1 not found"],
    });

    render(
      <BatchActionBar
        assigneeOptions={[
          { label: "Assign to...", value: "" },
          { label: "최호", value: "user-1" },
        ]}
        onClearSelection={vi.fn()}
        projectId="project-1"
        selectedCount={1}
        selectedIssueIds={["issue-1"]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Priority" }));
    await user.click(screen.getByRole("option", { name: "High" }));

    await waitFor(() =>
      expect(batchUpdateIssuesActionMock).toHaveBeenCalledWith({
        projectId: "project-1",
        updates: [{ issueId: "issue-1", priority: "High" }],
      })
    );
    expect(toastErrorMock).toHaveBeenCalledWith("Failed to update priorities");
  }, 15_000);
});
