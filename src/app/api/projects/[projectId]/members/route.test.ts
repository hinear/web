import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  checkProjectAccessMock,
  createRequestSupabaseServerClientMock,
  getAuthenticatedActorIdOrNullMock,
  listProjectMembersMock,
} = vi.hoisted(() => ({
  checkProjectAccessMock: vi.fn(),
  createRequestSupabaseServerClientMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  listProjectMembersMock: vi.fn(),
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
      checkProjectAccess = checkProjectAccessMock;
      listProjectMembers = listProjectMembersMock;
    },
  })
);

import { GET } from "@/app/api/projects/[projectId]/members/route";

describe("GET /api/projects/[projectId]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRequestSupabaseServerClientMock.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await GET(
      new Request("https://hinear.test/api/projects"),
      {
        params: Promise.resolve({ projectId: "project-1" }),
      }
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when the actor cannot access the project", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    checkProjectAccessMock.mockResolvedValue(false);

    const response = await GET(
      new Request("https://hinear.test/api/projects"),
      {
        params: Promise.resolve({ projectId: "project-1" }),
      }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Forbidden",
    });
  });

  it("returns project members for an allowed actor", async () => {
    const members = [
      {
        id: "user-1",
        name: "최호",
        role: "owner",
        note: "Owner since Mar 25",
        avatarUrl: null,
        canRemove: false,
        isCurrentUser: false,
      },
    ];

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    checkProjectAccessMock.mockResolvedValue(true);
    listProjectMembersMock.mockResolvedValue(members);

    const response = await GET(
      new Request("https://hinear.test/api/projects"),
      {
        params: Promise.resolve({ projectId: "project-1" }),
      }
    );

    expect(checkProjectAccessMock).toHaveBeenCalledWith("project-1", "user-1");
    expect(listProjectMembersMock).toHaveBeenCalledWith("project-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      members,
    });
  });
});
