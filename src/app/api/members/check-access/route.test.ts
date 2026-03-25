import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createRequestSupabaseServerClientMock,
  getAuthenticatedActorIdOrNullMock,
  hasProjectPermissionMock,
} = vi.hoisted(() => ({
  createRequestSupabaseServerClientMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  hasProjectPermissionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

vi.mock(
  "@/features/project-members/repositories/SupabaseProjectMembersRepository",
  () => ({
    SupabaseProjectMembersRepository: class {
      hasProjectPermission = hasProjectPermissionMock;
    },
  })
);

import { POST } from "@/app/api/members/check-access/route";

describe("POST /api/members/check-access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRequestSupabaseServerClientMock.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await POST(
      new Request("https://hinear.test/api/members/check-access", {
        method: "POST",
        body: JSON.stringify({ projectId: "project-1", permission: "read" }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("https://hinear.test/api/members/check-access", {
        method: "POST",
        body: JSON.stringify({ permission: "read" }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "projectId and permission are required",
    });
  });

  it("returns 403 when payload userId does not match the actor", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("https://hinear.test/api/members/check-access", {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-1",
          permission: "read",
          userId: "user-2",
        }),
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Forbidden",
    });
  });

  it("returns whether the authenticated actor has the permission", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    hasProjectPermissionMock.mockResolvedValue(true);

    const response = await POST(
      new Request("https://hinear.test/api/members/check-access", {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-1",
          permission: "manage_members",
        }),
      })
    );

    expect(hasProjectPermissionMock).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      "manage_members"
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      allowed: true,
    });
  });
});
