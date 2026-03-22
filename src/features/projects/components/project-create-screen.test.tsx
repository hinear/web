import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectCreateScreen } from "@/features/projects/components/project-create-screen";

describe("ProjectCreateScreen", () => {
  it("renders the project creation form with the expected fields", () => {
    render(<ProjectCreateScreen action={vi.fn()} />);

    expect(screen.getByText("Hinear")).toBeInTheDocument();
    expect(screen.getByText("Project setup")).toBeInTheDocument();
    expect(screen.getByText("Project Setup")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Create a new project" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Project name")).toBeInTheDocument();
    expect(screen.getByLabelText("Project key")).toBeInTheDocument();
    expect(screen.getByLabelText("Project type")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create project" })
    ).toBeInTheDocument();
  });
});
