import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/notifications/components/NotificationSettingsCard", () => ({
  NotificationSettingsCard: () => (
    <div data-testid="notification-settings-mock">Notification Settings</div>
  ),
}));

import { ProfileSettingsScreen } from "@/features/auth/components/profile-settings-screen";

describe("ProfileSettingsScreen", () => {
  it("renders account details, notification settings, and a logout button", () => {
    render(
      <ProfileSettingsScreen
        accountId="user-1"
        displayName="Owner Name"
        email="owner@example.com"
        logoutAction={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Your profile" })
    ).toBeInTheDocument();
    expect(screen.getByText("Owner Name")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("user-1")).toBeInTheDocument();
    expect(
      screen.getByTestId("notification-settings-mock")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});
