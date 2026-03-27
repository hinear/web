import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mockKanbanBoardProps, useIssuesMock } = vi.hoisted(() => ({
  mockKanbanBoardProps: vi.fn(),
  useIssuesMock: vi.fn(),
}));
const { navigationState, toastErrorMock } = vi.hoisted(() => ({
  navigationState: {
    searchParams: "",
  },
  toastErrorMock: vi.fn(),
}));
const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/project-1",
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(navigationState.searchParams),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
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

vi.mock("@/components/organisms/CreateIssueTabletModal", () => ({
  CreateIssueTabletModal: ({
    onCancel,
    onClose,
  }: {
    onCancel?: () => void;
    onClose?: () => void;
  }) => (
    <div data-testid="create-issue-modal">
      <button onClick={onCancel} type="button">
        Cancel issue create
      </button>
      <button onClick={onClose} type="button">
        Close issue create
      </button>
    </div>
  ),
}));

import { KanbanBoardView } from "@/features/issues/components/KanbanBoardView";

describe("KanbanBoardView", () => {
  afterEach(() => {
    navigationState.searchParams = "";
    vi.clearAllMocks();
  });

  it("shows the mapped board-load error message", () => {
    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: new Error(
        "Your session expired. Sign in again, then refresh the board."
      ),
      isUpdatingIssues: false,
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
      isUpdatingIssues: false,
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

    // Check that the board header is rendered even with no issues
    expect(
      screen.getByRole("heading", { name: "Issue board" })
    ).toBeInTheDocument();
    expect(screen.getByText("Web Platform / WEB")).toBeInTheDocument();
    expect(
      screen.getByText("Focused view of triage, build, and shipped work.")
    ).toBeInTheDocument();
  });

  it("passes URL filter state through to the issues hook", () => {
    navigationState.searchParams =
      "search=bug&statuses=Todo&priorities=High&assigneeIds=user-2&labelIds=label-1";
    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: null,
      isUpdatingIssues: false,
      mutationError: null,
      updateIssue: vi.fn(),
    });

    render(
      <KanbanBoardView projectId="project-1" projectName="Web Platform" />
    );

    expect(useIssuesMock).toHaveBeenCalledWith("project-1", {
      assigneeIds: ["user-2"],
      labelIds: ["label-1"],
      priorities: ["High"],
      searchQuery: "bug",
      statuses: ["Todo"],
    });
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
      isUpdatingIssues: false,
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
    expect(toastErrorMock).toHaveBeenCalledWith(
      "We couldn't update the board. Try again."
    );
  });

  it("toggles the filter panel from the header action", async () => {
    const user = userEvent.setup();

    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: null,
      isUpdatingIssues: false,
      mutationError: null,
      updateIssue: vi.fn(),
    });

    render(
      <KanbanBoardView projectId="project-1" projectName="Web Platform" />
    );

    expect(
      screen.queryByRole("button", { name: "Clear filters" })
    ).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Filter" })[0]);

    expect(
      screen.getAllByRole("button", { name: "Clear filters" })[0]
    ).toBeInTheDocument();
  });

  it("routes to the dedicated create page when no inline create action exists", async () => {
    const user = userEvent.setup();

    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: null,
      isUpdatingIssues: false,
      mutationError: null,
      updateIssue: vi.fn(),
    });

    render(
      <KanbanBoardView projectId="project-1" projectName="Web Platform" />
    );

    await user.click(screen.getAllByRole("button", { name: "New issue" })[0]);

    expect(pushMock).toHaveBeenCalledWith("/projects/project-1/issues/new");
    expect(screen.queryByTestId("create-issue-modal")).not.toBeInTheDocument();
  });

  it("opens the create issue modal from the desktop header when an inline action exists", async () => {
    const user = userEvent.setup();

    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: null,
      isUpdatingIssues: false,
      mutationError: null,
      updateIssue: vi.fn(),
    });

    render(
      <KanbanBoardView
        createIssueAction={vi.fn()}
        projectId="project-1"
        projectName="Web Platform"
      />
    );

    await user.click(screen.getAllByRole("button", { name: "New issue" })[0]);

    expect(screen.getByTestId("create-issue-modal")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Close issue create" })
    );

    expect(screen.queryByTestId("create-issue-modal")).not.toBeInTheDocument();
  });

  it("shows pending guidance while the board is updating issues", () => {
    useIssuesMock.mockReturnValue({
      issues: [],
      loading: false,
      error: null,
      isUpdatingIssues: true,
      mutationError: null,
      updateIssue: vi.fn(),
    });

    render(
      <KanbanBoardView projectId="project-1" projectName="Web Platform" />
    );

    expect(
      screen.getByText(
        "Updating the board. Duplicate status changes are temporarily blocked until the current request finishes."
      )
    ).toBeInTheDocument();
  });
});
