import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SidebarItem } from "@/components/molecules/SidebarItem";

describe("SidebarItem", () => {
  it("renders as a link when an href is provided", () => {
    render(
      <SidebarItem href="/projects/project-1/settings" label="Settings" />
    );

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/projects/project-1/settings"
    );
  });

  it("disables active-looking buttons without behavior", () => {
    render(<SidebarItem label="Roadmap" />);

    const item = screen.getByRole("button", { name: "Roadmap" });
    expect(item).toBeDisabled();
    expect(item).toHaveAttribute("title", "This action is not available yet.");
  });

  it("remains interactive when a click handler exists", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<SidebarItem label="Issues" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Issues" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("prefers an explicit inactive state over the active variant preset", () => {
    render(
      <SidebarItem active={false} href="/projects/project-1" variant="active" />
    );

    const item = screen.getByRole("link", { name: "Active" });
    expect(item.className).toContain("border-transparent");
    expect(item.className).toContain("bg-[var(--color-ink-900)]");
  });
});
