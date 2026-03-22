import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectSettingsScreen } from "@/features/projects/components/project-settings-screen";

describe("ProjectSettingsScreen", () => {
  it("renders settings navigation and access controls", () => {
    render(
      <ProjectSettingsScreen
        inviteAction={vi.fn()}
        invitations={[
          {
            id: "invitation-1",
            email: "alex@hinear.app",
            token: "token-1",
            invitedBy: "Jamie",
            status: "pending",
            expiresAt: "2026-03-27T00:00:00.000Z",
            createdAt: "2026-03-20T00:00:00.000Z",
          },
        ]}
        members={[
          {
            id: "user-1",
            name: "Alex",
            role: "owner",
            note: "Owner since Mar 20",
            canRemove: false,
            isCurrentUser: true,
          },
          {
            id: "user-2",
            name: "Jordan",
            role: "member",
            note: "Joined Mar 20",
            canRemove: true,
          },
        ]}
        project={{
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issueSeq: 2,
          createdBy: "user-1",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Manage Web Platform" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Project details" })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Web Platform")).toBeInTheDocument();
    expect(screen.getByDisplayValue("WEB")).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Remove every additional member and revoke all pending invitations before switching this project to personal."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to workspace" })
    ).toHaveAttribute("href", "/projects/project-1");
    expect(
      screen.getByRole("heading", { name: "Project Access & Invitations" })
    ).toBeInTheDocument();
  });
});
