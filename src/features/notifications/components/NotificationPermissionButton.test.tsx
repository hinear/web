"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationPermissionButton } from "@/features/notifications/components/NotificationPermissionButton";

describe("NotificationPermissionButton", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "QUJDRA");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null)));
  });

  it("shows guidance instead of a blocking failure when notifications are unsupported", async () => {
    const user = userEvent.setup();

    // @ts-expect-error test override
    delete window.Notification;

    render(<NotificationPermissionButton />);

    await user.click(
      screen.getByRole("button", { name: "Notifications unavailable" })
    );

    expect(
      screen.getByText("This device does not support browser notifications.")
    ).toBeInTheDocument();
  });

  it("keeps the control reachable when permission is denied", async () => {
    const user = userEvent.setup();

    window.Notification.permission = "denied";

    render(<NotificationPermissionButton />);

    await user.click(
      screen.getByRole("button", { name: "Notifications blocked" })
    );

    expect(
      screen.getByText(
        "Enable notifications again from your browser or device settings."
      )
    ).toBeInTheDocument();
  });

  it("shows an enabled state message after a successful subscription", async () => {
    const user = userEvent.setup();
    window.Notification.requestPermission = vi
      .fn()
      .mockResolvedValue("granted");

    render(<NotificationPermissionButton />);

    await user.click(
      screen.getByRole("button", { name: "Enable notifications" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Notifications are enabled on this device.")
      ).toBeInTheDocument();
    });
  });
});
