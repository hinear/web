import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectAccessCard } from "@/features/projects/components/project-operation-cards";

describe("ProjectAccessCard", () => {
  it("filters members and invitations from the search field", async () => {
    const user = userEvent.setup();

    render(
      <ProjectAccessCard
        action={vi.fn()}
        invitationAction={vi.fn()}
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
            id: "member-1",
            name: "Alex Kim",
            role: "owner",
            note: "Owner since Mar 20",
            canRemove: false,
            isCurrentUser: true,
          },
          {
            id: "member-2",
            name: "Jordan Park",
            role: "member",
            note: "Joined Mar 20",
            canRemove: true,
          },
        ]}
      />
    );

    await user.type(screen.getByLabelText("Search members"), "alex");

    expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    expect(screen.queryByText("Jordan Park")).not.toBeInTheDocument();
    expect(screen.getByText("alex@hinear.app")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View pending invitations" })
    ).toHaveAttribute("href", "#pending-invitations");
  });

  it("renders an empty search state when no member matches", async () => {
    const user = userEvent.setup();

    render(
      <ProjectAccessCard
        members={[
          {
            id: "member-1",
            name: "Alex Kim",
            role: "owner",
            note: "Owner since Mar 20",
            canRemove: false,
          },
        ]}
      />
    );

    await user.type(screen.getByLabelText("Search members"), "nobody");

    expect(screen.getByText("No members match “nobody”.")).toBeInTheDocument();
  });

  it("disables access management controls for non-owner viewers", () => {
    render(
      <ProjectAccessCard
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
            id: "member-1",
            name: "Alex Kim",
            role: "owner",
            note: "Owner since Mar 20",
            canRemove: false,
          },
          {
            id: "member-2",
            name: "Jordan Park",
            role: "member",
            note: "Joined Mar 20",
            canRemove: true,
            isCurrentUser: true,
          },
        ]}
      />
    );

    expect(screen.getByLabelText("Invite member")).toBeDisabled();
    expect(
      screen.getByText(
        "Pending invitation controls are limited to project owners."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Owner only")).toBeInTheDocument();
  });
});
