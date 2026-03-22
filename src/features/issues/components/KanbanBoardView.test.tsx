import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockKanbanBoardProps, useIssuesMock } = vi.hoisted(() => ({
  mockKanbanBoardProps: vi.fn(),
  useIssuesMock: vi.fn(),
}));

vi.mock("@/features/issues/hooks/useIssues", () => ({
  useIssues: useIssuesMock,
}));

vi.mock("@/features/issues/components/KanbanBoard", () => ({
  KanbanBoard: (props: {
    onIssueUpdate?: (
      issueId: string,
      updates: { status?: string }
    ) => Promise<void> | void;
  }) => {
    mockKanbanBoardProps(props);

    return (
      <button
        onClick={() => props.onIssueUpdate?.("issue-1", { status: "Done" })}
        type="button"
      >
        Trigger board update
      </button>
    );
  },
}));

import { KanbanBoardView } from "@/features/issues/components/KanbanBoardView";

describe("KanbanBoardView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the mapped board-load error message", () => {
    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: new Error(
        "Your session expired. Sign in again, then refresh the board."
      ),
      mutationError: null,
      updateIssue: vi.fn(),
    });

    render(
      <KanbanBoardView projectId="project-1" projectName="Web Platform" />
    );

    expect(
      screen.getByText(
        "Your session expired. Sign in again, then refresh the board."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("We couldn't load the Web Platform board right now.")
    ).toBeInTheDocument();
  });

  it("shows an empty-state panel when there are no issues", () => {
    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: null,
      mutationError: null,
      updateIssue: vi.fn(),
    });

    render(
      <KanbanBoardView
        projectId="project-1"
        projectKey="WEB"
        projectName="Web Platform"
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "This board is ready for the first issue.",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("No issues yet")).toBeInTheDocument();
  });

  it("shows the mapped board-update error message", async () => {
    const user = userEvent.setup();
    const updateIssue = vi.fn().mockRejectedValue(new Error("ignored"));

    useIssuesMock.mockReturnValue({
      issues: [
        {
          id: "issue-1",
          projectId: "project-1",
          issueNumber: 1,
          identifier: "WEB-1",
          title: "Board issue",
          status: "Backlog",
          priority: "Medium",
          assigneeId: null,
          labels: [],
          description: "",
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
          version: 1,
        },
      ],
      loading: false,
      error: null,
      mutationError: new Error(
        "We couldn't update that issue on the board. Refresh and try again."
      ),
      updateIssue,
    });

    render(
      <KanbanBoardView projectId="project-1" projectName="Web Platform" />
    );

    await user.click(
      screen.getByRole("button", { name: "Trigger board update" })
    );

    expect(updateIssue).toHaveBeenCalledWith("issue-1", { status: "Done" });
    expect(
      screen.getByText(
        "We couldn't update that issue on the board. Refresh and try again."
      )
    ).toBeInTheDocument();
  });
});
