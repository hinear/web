import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IssueDetailScreen } from "@/features/issues/components/issue-detail-screen";

describe("IssueDetailScreen", () => {
  it("renders the issue detail shell with empty comment and activity states", () => {
    render(
      <IssueDetailScreen
        issue={{
          id: "issue-1",
          projectId: "project-1",
          issueNumber: 1,
          identifier: "WEB-1",
          title: "Add issue detail page",
          status: "Triage",
          priority: "No Priority",
          assigneeId: null,
          description: "",
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
      />
    );

    expect(screen.getByText("WEB-1")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add issue detail page" })
    ).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });
});
