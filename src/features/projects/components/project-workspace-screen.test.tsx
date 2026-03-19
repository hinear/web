import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectWorkspaceScreen } from "@/features/projects/components/project-workspace-screen";

describe("ProjectWorkspaceScreen", () => {
  it("renders the project context and issue creation form", () => {
    render(
      <ProjectWorkspaceScreen
        action={vi.fn()}
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 1,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Web Platform" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create a new triage issue for WEB.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Issue title")).toBeInTheDocument();
    expect(screen.getByLabelText("Issue description")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create issue" })
    ).toBeInTheDocument();
  });
});
