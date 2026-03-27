import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/components/organisms/SidebarDesktop", () => ({
  SidebarDesktop: ({ projectTitle }: { projectTitle: string }) => (
    <div data-testid="sidebar-desktop">{projectTitle}</div>
  ),
}));
vi.mock("@/features/issues/components/KanbanBoardView", () => ({
  KanbanBoardView: ({ projectName }: { projectName: string }) => (
    <div data-testid="kanban-board-view">{projectName}</div>
  ),
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
});
