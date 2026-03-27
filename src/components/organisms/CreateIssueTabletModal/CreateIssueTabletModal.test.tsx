import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateIssueTabletModal } from "@/components/organisms/CreateIssueTabletModal";

const { createLabelActionMock, getLabelsActionMock } = vi.hoisted(() => ({
  createLabelActionMock: vi.fn(),
  getLabelsActionMock: vi.fn(),
}));
const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
}));

vi.mock("@/features/issues/actions/get-labels-action", () => ({
  getLabelsAction: getLabelsActionMock,
}));

vi.mock("@/features/issues/actions/create-label-action", () => ({
  createLabelAction: createLabelActionMock,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: vi.fn(),
  },
}));

describe("CreateIssueTabletModal", () => {
  beforeEach(() => {
    getLabelsActionMock.mockReset();
    createLabelActionMock.mockReset();
    toastErrorMock.mockReset();
    getLabelsActionMock.mockResolvedValue({
      success: true,
      labels: [
        { id: "label-1", name: "Bug", color: "#DC2626" },
        { id: "label-2", name: "Docs", color: "#2563EB" },
      ],
    });
    createLabelActionMock.mockResolvedValue({
      success: true,
      label: { id: "label-3", name: "Mobile", color: "#16A34A" },
    });
  });

  it("loads labels once and submits selected label names through the hidden input", async () => {
    const { container } = render(
      <CreateIssueTabletModal projectId="project-1" />
    );

    await waitFor(() =>
      expect(getLabelsActionMock).toHaveBeenCalledWith("project-1")
    );
    expect(getLabelsActionMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Select labels"));
    fireEvent.click(screen.getByRole("button", { name: "Bug" }));

    await waitFor(() => {
      const hiddenInput = container.querySelector(
        'input[name="labels"]'
      ) as HTMLInputElement | null;
      expect(hiddenInput?.value).toBe("Bug");
    });
  });

  it("calls close and cancel handlers when they are wired", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onClose = vi.fn();

    render(
      <CreateIssueTabletModal
        action={vi.fn()}
        onCancel={onCancel}
        onClose={onClose}
        projectId="project-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("prevents submit when the title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CreateIssueTabletModal
        action={vi.fn()}
        defaultTitle=""
        onSubmit={onSubmit}
        projectId="project-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Create issue" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith("Please enter a title.");
  });

  it("submits when a title is present and submit wiring exists", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CreateIssueTabletModal
        action={vi.fn()}
        defaultTitle="Initial title"
        onSubmit={onSubmit}
        projectId="project-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Create issue" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows pending feedback and blocks duplicate submits while creation is in flight", async () => {
    const user = userEvent.setup();
    let resolveSubmit: (() => void) | null = null;
    const onSubmit = vi.fn(
      (event: React.FormEvent<HTMLFormElement>) =>
        new Promise<void>((resolve) => {
          event.preventDefault();
          resolveSubmit = resolve;
        })
    );

    render(
      <CreateIssueTabletModal
        defaultTitle="Initial title"
        onCancel={vi.fn()}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        projectId="project-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Create issue" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Creating issue..." })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close modal" })).toBeDisabled();
    expect(
      screen.getByText(
        "Creating your issue now. Duplicate submits are blocked until this request finishes."
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Creating issue..." }));

    expect(onSubmit).toHaveBeenCalledTimes(1);

    resolveSubmit?.();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create issue" })
      ).toBeEnabled();
    });
  });

  it("shows failure feedback and recovers when submit fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      throw new Error("We couldn't create the issue. Try again.");
    });

    render(
      <CreateIssueTabletModal
        defaultTitle="Initial title"
        onSubmit={onSubmit}
        projectId="project-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Create issue" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "We couldn't create the issue. Try again."
      );
      expect(
        screen.getByRole("button", { name: "Create issue" })
      ).toBeEnabled();
    });
  });
});
