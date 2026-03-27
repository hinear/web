import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

vi.mock("@/components/molecules/MarkdownEditor", () => ({
  MarkdownEditor: ({
    onChange,
    placeholder,
    value,
  }: {
    onChange?: (value: string) => void;
    placeholder?: string;
    value?: string;
  }) => (
    <textarea
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  ),
}));

const { createLabelActionMock, updateIssueLabelsActionMock } = vi.hoisted(
  () => ({
    createLabelActionMock: vi.fn(),
    updateIssueLabelsActionMock: vi.fn(),
  })
);

vi.mock("@/features/issues/actions/create-label-action", () => ({
  createLabelAction: createLabelActionMock,
}));

vi.mock("@/features/issues/actions/update-issue-labels-action", () => ({
  updateIssueLabelsAction: updateIssueLabelsActionMock,
}));

import { IssueDetailDrawerScreen } from "@/features/issues/components/issue-drawer-screen";

const baseIssue = {
  id: "issue-1",
  projectId: "project-1",
  issueNumber: 1,
  identifier: "WEB-1",
  title: "Drawer issue",
  status: "Todo" as const,
  priority: "Medium" as const,
  assigneeId: null,
  labels: [],
  description: "<p>Existing description</p>",
  dueDate: null,
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: "2026-03-20T00:00:00.000Z",
  updatedAt: "2026-03-20T00:00:00.000Z",
  version: 1,
};

describe("IssueDetailDrawerScreen", () => {
  beforeEach(() => {
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    createLabelActionMock.mockReset();
    updateIssueLabelsActionMock.mockReset();
    updateIssueLabelsActionMock.mockResolvedValue({ success: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            activityLog: [],
            issue: baseIssue,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      )
    );
  });

  it("uses the explicit close callback when provided", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <IssueDetailDrawerScreen
        assigneeOptions={[{ label: "Unassigned", value: "" }]}
        boardHref="/projects/project-1"
        fullPageHref="/projects/project-1/issues/issue-1?view=full"
        issue={baseIssue}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "Open full page to comment" })
    ).toHaveAttribute("href", "/projects/project-1/issues/issue-1?view=full");
  });

  it("saves drawer changes after an edit", async () => {
    const user = userEvent.setup();

    render(
      <IssueDetailDrawerScreen
        assigneeOptions={[{ label: "Unassigned", value: "" }]}
        boardHref="/projects/project-1"
        fullPageHref="/projects/project-1/issues/issue-1?view=full"
        issue={baseIssue}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save changes" });
    expect(saveButton).toBeDisabled();

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Drawer issue updated");

    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    await waitFor(() =>
      expect(updateIssueLabelsActionMock).toHaveBeenCalledWith({
        issueId: "issue-1",
        labelIds: [],
        projectId: "project-1",
      })
    );

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith("Drawer changes saved.")
    );
  });

  it("shows failure guidance and lets the user retry drawer save", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Failed once." }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            activityLog: [],
            issue: {
              ...baseIssue,
              title: "Drawer issue updated",
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <IssueDetailDrawerScreen
        assigneeOptions={[{ label: "Unassigned", value: "" }]}
        boardHref="/projects/project-1"
        fullPageHref="/projects/project-1/issues/issue-1?view=full"
        issue={baseIssue}
      />
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Drawer issue updated");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "We couldn't save your changes. Try again."
      );
    });

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith("Drawer changes saved.");
    });
  });
});
