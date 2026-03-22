// @vitest-environment browser

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IssueDetailScreen } from "@/features/issues/components/issue-detail-screen";

const baseIssue = {
  id: "issue-1",
  projectId: "project-1",
  issueNumber: 1,
  identifier: "WEB-1",
  title: "Add issue detail page",
  status: "Triage" as const,
  priority: "No Priority" as const,
  assigneeId: null,
  labels: [],
  description: "",
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: "2026-03-20T00:00:00.000Z",
  updatedAt: "2026-03-20T00:00:00.000Z",
  version: 1,
};

describe("IssueDetailScreen browser mutations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reloads the latest issue when the server reports an optimistic-lock conflict", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "CONFLICT",
          currentIssue: {
            ...baseIssue,
            title: "Latest title",
            status: "Done",
            priority: "High",
            description: "Updated elsewhere",
            updatedBy: "user-2",
            updatedAt: "2026-03-20T02:00:00.000Z",
            version: 2,
          },
          currentVersion: 2,
          requestedVersion: 1,
          message: "This issue has changed since you loaded it.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<IssueDetailScreen issue={baseIssue} />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New local title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save title" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Latest title")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "최신 변경을 먼저 반영해야 합니다" })
    ).toBeInTheDocument();
    expect(screen.getByText("버전 비교")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("shows a clearer session-expired error for failed mutations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "AUTH_REQUIRED",
          error: "Authentication required.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<IssueDetailScreen issue={baseIssue} />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Retry title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save title" }));

    await waitFor(() => {
      expect(
        screen.getByText("Your session expired. Sign in again and retry.")
      ).toBeInTheDocument();
    });
  });
});
