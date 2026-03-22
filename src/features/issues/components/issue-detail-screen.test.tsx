import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  IssueDetailErrorScreen,
  IssueDetailLoadingScreen,
  IssueDetailNotFoundScreen,
  IssueDetailScreen,
} from "@/features/issues/components/issue-detail-screen";
import { server } from "@/mocks/server";

describe("IssueDetailScreen", () => {
  // Clean up test-specific MSW handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  it("renders the issue detail shell with empty comment and activity states", () => {
    render(
      <IssueDetailScreen
        boardHref="/projects/project-1"
        createHref="/projects/project-1/issues/new"
        issue={{
          id: "issue-1",
          projectId: "project-1",
          issueNumber: 1,
          identifier: "WEB-1",
          title: "Add issue detail page",
          status: "Triage",
          priority: "No Priority",
          assigneeId: null,
          labels: [],
          description: "",
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
          version: 1,
        }}
      />
    );

    expect(screen.getAllByText("WEB-1")).toHaveLength(2);
    expect(
      screen.getByDisplayValue("Add issue detail page")
    ).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByText("No labels selected")).toBeInTheDocument();
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to board" })).toHaveAttribute(
      "href",
      "/projects/project-1"
    );
  });

  it("renders persisted labels when present", () => {
    render(
      <IssueDetailScreen
        issue={{
          id: "issue-2",
          projectId: "project-1",
          issueNumber: 2,
          identifier: "WEB-2",
          title: "Persist labels",
          status: "Backlog",
          priority: "High",
          assigneeId: "user-1",
          labels: [
            { id: "label-1", name: "Auth", color: "#5E6AD2" },
            { id: "label-2", name: "Backend", color: "#16A34A" },
          ],
          description: "Labels should render from the database.",
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
          version: 1,
        }}
      />
    );

    expect(screen.getByText("Auth")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.queryByText("No labels selected")).not.toBeInTheDocument();
  });

  it("renders the loading state", () => {
    render(<IssueDetailLoadingScreen />);

    expect(
      screen.getByRole("heading", { name: "Loading" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/loading the latest issue details and activity/i)
    ).toBeInTheDocument();
  });

  it("renders the error state actions", () => {
    render(
      <IssueDetailErrorScreen
        boardHref="/projects/project-1"
        onRetry={() => {}}
      />
    );

    expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(
      screen.getByText(/return to the board and open another issue/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to board" })).toHaveAttribute(
      "href",
      "/projects/project-1"
    );
  });

  it("renders the not-found state with replacement path", () => {
    render(
      <IssueDetailNotFoundScreen
        boardHref="/projects/project-1"
        createHref="/projects/project-1/issues/new"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Not Found" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This issue may have been deleted or moved/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create issue" })).toHaveAttribute(
      "href",
      "/projects/project-1/issues/new"
    );
  });
});
