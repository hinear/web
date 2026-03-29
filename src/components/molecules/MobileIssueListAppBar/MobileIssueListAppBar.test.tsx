import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileIssueListAppBar } from "@/components/molecules/MobileIssueListAppBar";

describe("MobileIssueListAppBar", () => {
  it("renders the mobile top surface with safe-area spacing", () => {
    render(<MobileIssueListAppBar title="Web Platform" />);

    expect(screen.getByTestId("mobile-issue-list-app-bar")).toHaveClass(
      "app-mobile-top-surface"
    );
  });

  it("keeps action buttons on the shared mobile touch target size", () => {
    render(
      <MobileIssueListAppBar
        onCreateClick={vi.fn()}
        onSearchClick={vi.fn()}
        title="Web Platform"
      />
    );

    expect(screen.getByRole("button", { name: "Search issues" })).toHaveClass(
      "app-mobile-touch-target"
    );
    expect(screen.getByRole("button", { name: "Create issue" })).toHaveClass(
      "app-mobile-touch-target"
    );
  });

  it("toggles search action on first tap", async () => {
    const user = userEvent.setup();
    const onSearchClick = vi.fn();

    render(
      <MobileIssueListAppBar
        onCreateClick={vi.fn()}
        onSearchClick={onSearchClick}
        title="Web Platform"
      />
    );

    await user.click(screen.getByRole("button", { name: "Search issues" }));

    expect(onSearchClick).toHaveBeenCalledTimes(1);
  });
});
