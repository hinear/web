import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectDashboardScreen } from "@/features/projects/components/project-dashboard-screen";

describe("ProjectDashboardScreen", () => {
  it("renders the dashboard route shell and recent issues", () => {
    render(
      <ProjectDashboardScreen
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
        summary={{
          activeIssueCount: 4,
          doneIssueCount: 8,
          memberCount: 3,
          pendingInvitationCount: 1,
          totalIssueCount: 12,
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Web Platform" })
    ).toBeInTheDocument();
    expect(screen.getByText("Exploration dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open board" })).toHaveAttribute(
      "href",
      "/projects/project-1"
    );
    expect(screen.getByRole("link", { name: "New issue" })).toHaveAttribute(
      "href",
      "/projects/project-1/issues/new"
    );
    expect(
      screen.getByText("Refine create issue route plan")
    ).toBeInTheDocument();
    expect(screen.getByText("Board landing")).toBeInTheDocument();
    expect(screen.getByText("Canonical detail")).toBeInTheDocument();
  });
});
