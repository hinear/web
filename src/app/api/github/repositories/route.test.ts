import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listUserRepositoriesMock: vi.fn(),
  requireAuthenticatedActorIdMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  requireAuthenticatedActorId: mocks.requireAuthenticatedActorIdMock,
}));

vi.mock("@/lib/github/api-client", () => ({
  GitHubApiClient: class {
    listUserRepositories = mocks.listUserRepositoriesMock;
  },
}));

import { GET } from "@/app/api/github/repositories/route";

describe("GET /api/github/repositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedActorIdMock.mockResolvedValue("user-1");
  });

  it("returns 401 when github temp token cookie is missing", async () => {
    const response = await GET({
      cookies: {
        get: vi.fn().mockReturnValue(undefined),
      },
    } as any);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "GitHub authentication required",
    });
  });

  it("returns mapped repository list when token exists", async () => {
    mocks.listUserRepositoriesMock.mockResolvedValue([
      {
        id: 1,
        name: "hinear",
        full_name: "zerone/hinear",
        owner: { login: "zerone" },
        private: false,
        description: "Repo",
      },
    ]);

    const response = await GET({
      cookies: {
        get: vi.fn().mockReturnValue({ value: "oauth-token" }),
      },
    } as any);

    expect(mocks.requireAuthenticatedActorIdMock).toHaveBeenCalledTimes(1);
    expect(mocks.listUserRepositoriesMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      repositories: [
        {
          name: "hinear",
          fullName: "zerone/hinear",
          private: false,
          description: "Repo",
        },
      ],
    });
  });
});
