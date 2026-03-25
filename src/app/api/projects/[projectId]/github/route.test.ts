import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createGitHubInstallationClientForRepositoryMock: vi.fn(),
  createRequestSupabaseServerClientMock: vi.fn(),
  disconnectGitHubIntegrationMock: vi.fn(),
  getGitHubIntegrationMock: vi.fn(),
  getRepositoryMock: vi.fn(),
  requireAuthenticatedActorIdMock: vi.fn(),
  updateGitHubIntegrationMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  requireAuthenticatedActorId: mocks.requireAuthenticatedActorIdMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient:
    mocks.createRequestSupabaseServerClientMock,
}));

vi.mock("@/lib/github/app-auth", () => ({
  createGitHubInstallationClientForRepository:
    mocks.createGitHubInstallationClientForRepositoryMock,
  isGitHubAppConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/github/api-client", () => ({
  GitHubApiClient: class {
    getRepository = mocks.getRepositoryMock;
  },
}));

vi.mock(
  "@/features/projects/repositories/github-integration-repository",
  () => ({
    GitHubIntegrationRepository: class {
      getGitHubIntegration = mocks.getGitHubIntegrationMock;
      updateGitHubIntegration = mocks.updateGitHubIntegrationMock;
      disconnectGitHubIntegration = mocks.disconnectGitHubIntegrationMock;
    },
  })
);

import { DELETE, GET, POST } from "@/app/api/projects/[projectId]/github/route";

function createSupabaseOwnerCheckMock(role: "owner" | "member" | null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: role ? { role } : null }),
          }),
        }),
      }),
    }),
  };
}

describe("API /api/projects/[projectId]/github", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedActorIdMock.mockResolvedValue("user-1");
    mocks.createGitHubInstallationClientForRepositoryMock.mockResolvedValue({
      getRepository: mocks.getRepositoryMock,
    });
  });

  it("GET returns 403 when actor is not an owner", async () => {
    mocks.createRequestSupabaseServerClientMock.mockResolvedValue(
      createSupabaseOwnerCheckMock("member")
    );

    const response = await GET({} as any, {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Only project owners can manage GitHub integration",
    });
  });

  it("POST returns 401 when github temp cookie is missing", async () => {
    mocks.createRequestSupabaseServerClientMock.mockResolvedValue(
      createSupabaseOwnerCheckMock("owner")
    );

    const response = await POST(
      {
        json: vi.fn().mockResolvedValue({
          repoOwner: "zerone",
          repoName: "hinear",
        }),
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as any,
      {
        params: Promise.resolve({ projectId: "project-1" }),
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "GitHub authentication required",
    });
  });

  it("POST returns 500 when GitHub App installation client cannot be created", async () => {
    mocks.createGitHubInstallationClientForRepositoryMock.mockResolvedValue(
      null
    );
    mocks.createRequestSupabaseServerClientMock.mockResolvedValue(
      createSupabaseOwnerCheckMock("owner")
    );

    const response = await POST(
      {
        json: vi.fn().mockResolvedValue({
          repoOwner: "zerone",
          repoName: "hinear",
        }),
        cookies: {
          get: vi.fn().mockReturnValue({ value: "oauth-token" }),
        },
      } as any,
      {
        params: Promise.resolve({ projectId: "project-1" }),
      }
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error:
        "GitHub App credentials are not configured on the server (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY)",
    });
  });

  it("POST verifies repository access and stores integration settings", async () => {
    mocks.getRepositoryMock.mockResolvedValue({
      id: 1,
      name: "hinear",
      full_name: "zerone/hinear",
      owner: { login: "zerone" },
      private: false,
      description: null,
    });
    mocks.createRequestSupabaseServerClientMock.mockResolvedValue(
      createSupabaseOwnerCheckMock("owner")
    );

    const response = await POST(
      {
        json: vi.fn().mockResolvedValue({
          repoOwner: "zerone",
          repoName: "hinear",
        }),
        cookies: {
          get: vi.fn().mockReturnValue({ value: "oauth-token" }),
        },
      } as any,
      {
        params: Promise.resolve({ projectId: "project-1" }),
      }
    );

    expect(
      mocks.createGitHubInstallationClientForRepositoryMock
    ).toHaveBeenCalledWith("zerone", "hinear");
    expect(mocks.getRepositoryMock).toHaveBeenCalledTimes(2);
    expect(mocks.updateGitHubIntegrationMock).toHaveBeenCalledWith({
      projectId: "project-1",
      enabled: true,
      repoOwner: "zerone",
      repoName: "hinear",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      settings: {
        enabled: true,
        repoOwner: "zerone",
        repoName: "hinear",
        connected: true,
      },
    });
  });

  it("DELETE disconnects integration for owner", async () => {
    mocks.createRequestSupabaseServerClientMock.mockResolvedValue(
      createSupabaseOwnerCheckMock("owner")
    );

    const response = await DELETE({} as any, {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(mocks.disconnectGitHubIntegrationMock).toHaveBeenCalledWith(
      "project-1"
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
