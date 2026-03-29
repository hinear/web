"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationSettingsCard } from "@/features/notifications/components/NotificationSettingsCard";

describe("NotificationSettingsCard", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "QUJDRA");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
          const url = input.toString();

          if (url === "/api/notifications/preferences" && !init?.method) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  preferences: {
                    comment_added: true,
                    issue_assigned: true,
                    issue_status_changed: false,
                    project_invited: true,
                  },
                  success: true,
                }),
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                  status: 200,
                }
              )
            );
          }

          return Promise.resolve(
            new Response(
              JSON.stringify({
                preferences: {
                  comment_added: true,
                  issue_assigned: true,
                  issue_status_changed: false,
                  project_invited: true,
                },
                success: true,
              }),
              {
                headers: {
                  "Content-Type": "application/json",
                },
                status: 200,
              }
            )
          );
        })
    );
  });

  it("shows permission guidance alongside the notification toggles", async () => {
    render(<NotificationSettingsCard />);

    await waitFor(() => {
      expect(screen.getByText("Notification Settings")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Permission prompts only appear after you tap the notification control."
      )
    ).toBeInTheDocument();
  });

  it("keeps the notification entry visible while preferences are loaded", async () => {
    render(<NotificationSettingsCard />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Enable notifications" })
      ).toBeInTheDocument();
    });
  });

  it("lets the user toggle a preference after the card loads", async () => {
    const user = userEvent.setup();
    render(<NotificationSettingsCard />);

    const toggle = await screen.findByRole("switch", {
      name: /Status Change Notifications/i,
    });

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});
