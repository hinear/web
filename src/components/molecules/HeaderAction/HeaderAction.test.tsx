import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HeaderAction } from "@/components/molecules/HeaderAction";

describe("HeaderAction", () => {
  it("renders as a link when an href is provided", () => {
    render(<HeaderAction href="/projects/project-1" label="Open board" />);

    expect(screen.getByRole("link", { name: "Open board" })).toHaveAttribute(
      "href",
      "/projects/project-1"
    );
  });

  it("disables button-like controls that do not have a real action", () => {
    render(<HeaderAction label="Filter" />);

    const action = screen.getByRole("button", { name: "Filter" });
    expect(action).toBeDisabled();
    expect(action).toHaveAttribute(
      "title",
      "This action is not available yet."
    );
  });

  it("keeps click handlers interactive when a real action is wired", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<HeaderAction label="New issue" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "New issue" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the shared mobile touch target affordance", () => {
    render(<HeaderAction label="New issue" onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "New issue" })).toHaveClass(
      "app-mobile-touch-target"
    );
  });
});
