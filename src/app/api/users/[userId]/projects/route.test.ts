import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createRequestSupabaseServerClientMock,
  getAuthenticatedActorIdOrNullMock,
  listUserProjectsMock,
} = vi.hoisted(() => ({
  createRequestSupabaseServerClientMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  listUserProjectsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

vi.mock(
  "@/features/projects/repositories/supabase-projects-repository",
  () => ({
    SupabaseProjectsRepository: class {
      listUserProjects = listUserProjectsMock;
    },
  })
);

import { GET } from "@/app/api/users/[userId]/projects/route";

describe("GET /api/users/[userId]/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRequestSupabaseServerClientMock.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await GET(new Request("https://hinear.test/api/users"), {
      params: Promise.resolve({ userId: "user-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 for another user's projects", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await GET(new Request("https://hinear.test/api/users"), {
      params: Promise.resolve({ userId: "user-2" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Forbidden",
    });
  });

  it("returns the authenticated user's projects", async () => {
    const projects = [
      {
        id: "project-1",
        key: "WEB",
        name: "Website",
        type: "team",
        issueSeq: 12,
        createdBy: "user-1",
        createdAt: "2026-03-25T00:00:00.000Z",
        updatedAt: "2026-03-25T00:00:00.000Z",
      },
    ];

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    listUserProjectsMock.mockResolvedValue(projects);

    const response = await GET(new Request("https://hinear.test/api/users"), {
      params: Promise.resolve({ userId: "user-1" }),
    });

    expect(listUserProjectsMock).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      projects,
    });
  });
});
