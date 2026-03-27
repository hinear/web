import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

vi.mock("@/features/performance/hooks/usePerformanceProfiler", () => ({
  usePerformanceProfiler: vi.fn(),
}));

vi.mock("@/components/molecules/DueDateField", () => ({
  DueDateField: ({ label }: { label?: string }) => (
    <div>{label ?? "Due Date"}</div>
  ),
}));

vi.mock("@/components/molecules/LabelSelector", () => ({
  LabelSelector: () => <div>Label selector</div>,
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

vi.mock("@/features/issues/components/IssueActivityItem", () => ({
  IssueActivityItem: ({ summary }: { summary?: string }) => (
    <div>{summary ?? "activity"}</div>
  ),
}));

vi.mock("@/features/issues/components/IssueAssigneePill", () => ({
  IssueAssigneePill: ({ name }: { name?: string }) => (
    <div>{name ?? "Unassigned"}</div>
  ),
}));

vi.mock("@/features/issues/components/IssueCommentMeta", () => ({
  IssueCommentMeta: ({ authorLabel }: { authorLabel?: string }) => (
    <div>{authorLabel ?? "Author"}</div>
  ),
}));

vi.mock("@/features/issues/components/IssueDateMeta", () => ({
  IssueDateMeta: () => <span>Date</span>,
}));

vi.mock("@/features/issues/components/IssueEmptyState", () => ({
  IssueEmptyState: ({ message }: { message?: string }) => (
    <div>{message ?? "Empty"}</div>
  ),
}));

vi.mock("@/features/issues/components/IssueFieldBlock", () => ({
  IssueFieldBlock: ({
    children,
    label,
  }: {
    children: unknown;
    label?: string;
  }) => (
    <div>
      <span>{label}</span>
      {children}
    </div>
  ),
}));

vi.mock("@/features/issues/components/IssueIdentifierBadge", () => ({
  IssueIdentifierBadge: ({ identifier }: { identifier?: string }) => (
    <div>{identifier}</div>
  ),
}));

vi.mock("@/features/issues/components/IssueLabelChip", () => ({
  IssueLabelChip: ({ label }: { label?: { name: string } }) => (
    <div>{label?.name}</div>
  ),
}));

vi.mock("@/features/issues/components/IssueMetaRow", () => ({
  IssueMetaRow: ({ label, value }: { label?: string; value?: unknown }) => (
    <div>
      <span>{label}</span>
      {value}
    </div>
  ),
}));

vi.mock("@/features/issues/components/IssuePanel", () => ({
  IssuePanel: ({ children }: { children: unknown }) => (
    <section>{children}</section>
  ),
}));

vi.mock("@/features/issues/components/IssuePriorityBadge", () => ({
  IssuePriorityBadge: ({ priority }: { priority?: string }) => (
    <div>{priority}</div>
  ),
}));

vi.mock("@/features/issues/components/IssueSectionHeader", () => ({
  IssueSectionHeader: ({
    badge,
    title,
  }: {
    badge?: unknown;
    title?: string;
  }) => (
    <div>
      <span>{title}</span>
      {badge}
    </div>
  ),
}));

vi.mock("@/features/issues/components/IssueStatusBadge", () => ({
  IssueStatusBadge: ({ status }: { status?: string }) => <div>{status}</div>,
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

import { IssueDetailFullPageScreen } from "@/features/issues/components/issue-detail-full-page-screen";

const baseIssue = {
  id: "issue-1",
  projectId: "project-1",
  issueNumber: 1,
  identifier: "WEB-1",
  title: "Full page issue",
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

describe("IssueDetailFullPageScreen", () => {
  beforeEach(() => {
    pushMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    createLabelActionMock.mockReset();
    updateIssueLabelsActionMock.mockReset();
    updateIssueLabelsActionMock.mockResolvedValue({ success: true });
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string) => {
        if (input.endsWith("/comments")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                activityEntry: {
                  actorId: "user-1",
                  createdAt: "2026-03-21T00:00:00.000Z",
                  id: "activity-1",
                  summary: "Comment posted",
                },
                comment: {
                  id: "comment-1",
                  authorId: "user-1",
                  body: "<p>새 댓글</p>",
                  createdAt: "2026-03-21T00:00:00.000Z",
                  updatedAt: "2026-03-21T00:00:00.000Z",
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
        }

        return Promise.resolve(
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
        );
      })
    );
  });

  it("renders the close-detail navigation target", () => {
    render(
      <IssueDetailFullPageScreen
        boardHref="/projects/project-1"
        initialNow={Date.now()}
        issue={baseIssue}
      />
    );

    expect(
      screen.getByRole("link", { name: "Close detail view" })
    ).toHaveAttribute("href", "/projects/project-1");
  });

  it("saves full-page edits after a field change", async () => {
    const user = userEvent.setup();

    render(
      <IssueDetailFullPageScreen
        boardHref="/projects/project-1"
        initialNow={Date.now()}
        issue={baseIssue}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save changes" });
    expect(saveButton).toBeDisabled();

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Full page issue updated");

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
      expect(toastSuccessMock).toHaveBeenCalledWith("Changes saved.")
    );
  });

  it("posts a comment when the draft contains content", async () => {
    const user = userEvent.setup();

    render(
      <IssueDetailFullPageScreen
        boardHref="/projects/project-1"
        initialNow={Date.now()}
        issue={baseIssue}
      />
    );

    const postButton = screen.getByRole("button", { name: "Post comment" });
    expect(postButton).toBeDisabled();

    await user.type(
      screen.getAllByPlaceholderText("댓글을 입력하세요...")[0],
      "새 댓글"
    );

    expect(postButton).toBeEnabled();

    await user.click(postButton);

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith("Comment posted.")
    );
  });

  it("shows save failure guidance and recovers after a retry", async () => {
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
              title: "Full page issue updated",
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
      <IssueDetailFullPageScreen
        boardHref="/projects/project-1"
        initialNow={Date.now()}
        issue={baseIssue}
      />
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Full page issue updated");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "We couldn't save your changes. Try again."
      );
    });

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith("Changes saved.");
    });
  });

  it("shows comment failure guidance and recovers after a retry", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Comment failed." }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            activityEntry: {
              actorId: "user-1",
              createdAt: "2026-03-21T00:00:00.000Z",
              id: "activity-1",
              summary: "Comment posted",
            },
            comment: {
              id: "comment-1",
              authorId: "user-1",
              body: "<p>Retry comment</p>",
              createdAt: "2026-03-21T00:00:00.000Z",
              updatedAt: "2026-03-21T00:00:00.000Z",
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
      <IssueDetailFullPageScreen
        boardHref="/projects/project-1"
        initialNow={Date.now()}
        issue={baseIssue}
      />
    );

    const editor = screen.getAllByPlaceholderText("댓글을 입력하세요...")[0];
    await user.type(editor, "Retry comment");

    await user.click(screen.getByRole("button", { name: "Post comment" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "We couldn't post your comment. Try again."
      );
    });

    await user.click(screen.getByRole("button", { name: "Post comment" }));

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith("Comment posted.");
    });
  });
});
