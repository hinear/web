import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { kanbanBoardViewMock } = vi.hoisted(() => ({
  kanbanBoardViewMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/components/organisms/SidebarDesktop", () => ({
  SidebarDesktop: ({
    activeNavigation,
    navigationHrefs,
    projectTitle,
  }: {
    activeNavigation?: string;
    navigationHrefs?: Record<string, string>;
    projectTitle: string;
  }) => (
    <div data-testid="sidebar-desktop">
      <span>{projectTitle}</span>
      <span data-testid="sidebar-active-navigation">{activeNavigation}</span>
      <span data-testid="sidebar-issues">{navigationHrefs?.issues}</span>
      <span data-testid="sidebar-triage">{navigationHrefs?.triage}</span>
      <span data-testid="sidebar-active">{navigationHrefs?.active}</span>
      <span data-testid="sidebar-backlog">{navigationHrefs?.backlog}</span>
    </div>
  ),
}));
vi.mock("@/features/issues/components/KanbanBoardView", () => ({
  KanbanBoardView: (props: {
    createIssueAction?: unknown;
    projectName: string;
  }) => {
    kanbanBoardViewMock(props);
    return <div data-testid="kanban-board-view">{props.projectName}</div>;
  },
}));

import { ProjectWorkspaceScreen } from "@/features/projects/components/project-workspace-screen";

describe("ProjectWorkspaceScreen", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ issues: [], total: 0 }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the ETcEV-style board workspace shell", () => {
    render(
      <ProjectWorkspaceScreen
        action={vi.fn()}
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 1,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
      />
    );

    expect(screen.getByTestId("sidebar-desktop")).toHaveTextContent(
      "Web Platform"
    );
    expect(screen.getByTestId("kanban-board-view")).toHaveTextContent(
      "Web Platform"
    );
    expect(screen.getByTestId("sidebar-issues")).toHaveTextContent(
      "/projects/project-1"
    );
    expect(screen.getByTestId("sidebar-triage")).toHaveTextContent(
      "/projects/project-1?statuses=Triage"
    );
    expect(screen.getByTestId("sidebar-active")).toHaveTextContent(
      "/projects/project-1?statuses=In+Progress"
    );
    expect(screen.getByTestId("sidebar-backlog")).toHaveTextContent(
      "/projects/project-1?statuses=Backlog"
    );
    expect(screen.getByTestId("sidebar-active-navigation")).toHaveTextContent(
      "issues"
    );
  });

  it("renders a workspace notice when invitation acceptance completes", () => {
    render(
      <ProjectWorkspaceScreen
        action={vi.fn()}
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 1,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
        workspaceNoticeMessage="You joined Web Platform. The board and project access are ready."
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "You joined Web Platform. The board and project access are ready."
    );
  });

  it("renders provided project summary metrics", () => {
    render(
      <ProjectWorkspaceScreen
        action={vi.fn()}
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 4,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
        summary={{
          activeIssueCount: 3,
          doneIssueCount: 2,
          memberCount: 4,
          pendingInvitationCount: 1,
          totalIssueCount: 6,
        }}
      />
    );

    expect(screen.getByTestId("sidebar-desktop")).toHaveTextContent(
      "Web Platform"
    );
    expect(screen.getByTestId("kanban-board-view")).toHaveTextContent(
      "Web Platform"
    );
  });

  it("passes the create issue action down to the board view", () => {
    const action = vi.fn();

    render(
      <ProjectWorkspaceScreen
        action={action}
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 1,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
      />
    );

    expect(kanbanBoardViewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        createIssueAction: action,
      })
    );
  });

  it("passes the active sidebar item through to the desktop navigation", () => {
    render(
      <ProjectWorkspaceScreen
        action={vi.fn()}
        activeNavigation="backlog"
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 1,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
      />
    );

    expect(screen.getByTestId("sidebar-active-navigation")).toHaveTextContent(
      "backlog"
    );
  });
});
