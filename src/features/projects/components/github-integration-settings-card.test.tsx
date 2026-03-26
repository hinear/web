import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/projects/project-1/settings",
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/features/auth/components/github-auth-button", () => ({
  GitHubAuthButton: () => <button type="button">Connect with GitHub</button>,
}));

import { toast } from "sonner";
import { GitHubIntegrationSettingsCard } from "@/features/projects/components/github-integration-settings-card";

describe("GitHubIntegrationSettingsCard", () => {
  beforeEach(() => {
    navigationMocks.searchParams = new URLSearchParams();
    navigationMocks.replace.mockReset();
    vi.restoreAllMocks();
  });

  it("opens repo selector when returned from OAuth with github=select-repo", async () => {
    navigationMocks.searchParams = new URLSearchParams(
      "github=select-repo&from=oauth"
    );

    vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (String(input).includes("/api/github/repositories")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              repositories: [
                {
                  name: "hinear",
                  fullName: "zerone/hinear",
                  private: false,
                  description: null,
                },
              ],
            }),
            { status: 200 }
          )
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );
    });

    render(
      <GitHubIntegrationSettingsCard
        initialSettings={{ enabled: false }}
        projectId="project-1"
      />
    );

    await screen.findByText("Select Repository");
    expect(screen.getByText("zerone/hinear")).toBeInTheDocument();
    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/projects/project-1/settings?from=oauth"
    );
  });

  it("connects repository and renders connected state", async () => {
    navigationMocks.searchParams = new URLSearchParams("github=select-repo");

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockImplementation((input, init) => {
        const url = String(input);

        if (url.includes("/api/github/repositories")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                repositories: [
                  {
                    name: "hinear",
                    fullName: "zerone/hinear",
                    private: false,
                    description: null,
                  },
                ],
              }),
              { status: 200 }
            )
          );
        }

        if (
          url.includes("/api/projects/project-1/github") &&
          init?.method === "POST"
        ) {
          return Promise.resolve(
            new Response(JSON.stringify({ success: true }), { status: 200 })
          );
        }

        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );
      });

    render(
      <GitHubIntegrationSettingsCard
        initialSettings={{ enabled: false }}
        projectId="project-1"
      />
    );

    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "zerone/hinear" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect Repository" }));

    await screen.findByText("Connected Repository");
    expect(screen.getByText("zerone/hinear")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/projects/project-1/github",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("shows a read-only message instead of error toast for non-owners", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: "Only project owners can manage GitHub integration",
        }),
        { status: 403 }
      )
    );

    render(<GitHubIntegrationSettingsCard projectId="project-1" />);

    await screen.findByText("Read-only access");
    expect(
      screen.getByText("Only project owners can manage GitHub integration")
    ).toBeInTheDocument();
    expect(screen.queryByText("Connect with GitHub")).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/projects/project-1/github");
  });
});
