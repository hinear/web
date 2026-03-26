import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectOverviewScreen } from "@/features/projects/components/project-overview-screen";

describe("ProjectOverviewScreen", () => {
  it("renders the overview route shell and recent issues", () => {
    render(
      <ProjectOverviewScreen
        issues={[
          {
            id: "issue-1",
            projectId: "project-1",
            issueNumber: 12,
            identifier: "WEB-12",
            title: "Refine create issue route plan",
            status: "In Progress",
            priority: "High",
            assigneeId: null,
            labels: [],
            description: "",
            dueDate: null,
            createdBy: "user-1",
            updatedBy: "user-1",
            createdAt: "2026-03-20T00:00:00.000Z",
            updatedAt: "2026-03-21T03:00:00.000Z",
            version: 1,
          },
        ]}
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 12,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-21T03:00:00.000Z",
        }}
        projects={[
          {
            id: "project-1",
            key: "WEB",
            name: "Web Platform",
            type: "team",
            issueSeq: 12,
            createdBy: "user-1",
            createdAt: "2026-03-20T00:00:00.000Z",
            updatedAt: "2026-03-21T03:00:00.000Z",
          },
        ]}
        summary={{
          activeIssueCount: 4,
          backlogIssueCount: 3,
          doneIssueCount: 8,
          inProgressIssueCount: 4,
          memberCount: 3,
          pendingInvitationCount: 1,
          totalIssueCount: 12,
        }}
      />
    );

    expect(
      screen.getAllByRole("heading", { name: "Web Platform" }).length
    ).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: "Open Project" })
        .some((link) => link.getAttribute("href") === "/projects/project-1")
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: "Profile settings" })
        .some((link) => link.getAttribute("href") === "/projects/profile")
    ).toBe(true);
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Total issues").length).toBeGreaterThan(0);
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", {
          name: /WEB-12.*Refine create issue route plan/i,
        })
        .some(
          (link) =>
            link.getAttribute("href") ===
            "/projects/project-1/issues/issue-1?view=full"
        )
    ).toBe(true);
    expect(screen.getAllByText("Profile settings").length).toBeGreaterThan(0);
  });
});
