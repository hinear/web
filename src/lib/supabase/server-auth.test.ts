import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRequestSupabaseServerClientMock } = vi.hoisted(() => ({
  createRequestSupabaseServerClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

import {
  AuthenticationRequiredError,
  getAuthenticatedActorIdOrNull,
  getAuthenticatedUserOrNull,
  requireAuthenticatedActorId,
} from "@/lib/supabase/server-auth";

describe("server auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated user id when present", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

    createRequestSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "user-17@example.com",
              id: "user-17",
              user_metadata: {
                full_name: "User Seventeen",
              },
            },
          },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert,
      }),
    });

    await expect(getAuthenticatedUserOrNull()).resolves.toMatchObject({
      id: "user-17",
    });
    await expect(getAuthenticatedActorIdOrNull()).resolves.toBe("user-17");
    await expect(requireAuthenticatedActorId()).resolves.toBe("user-17");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: "User Seventeen",
        email: "user-17@example.com",
        email_normalized: "user-17@example.com",
        id: "user-17",
      }),
      { onConflict: "id" }
    );
  });

  it("returns null and throws when the request has no authenticated user", async () => {
    createRequestSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
          error: null,
        }),
      },
      from: vi.fn(),
    });

    await expect(getAuthenticatedUserOrNull()).resolves.toBeNull();
    await expect(getAuthenticatedActorIdOrNull()).resolves.toBeNull();
    await expect(requireAuthenticatedActorId()).rejects.toBeInstanceOf(
      AuthenticationRequiredError
    );
  });
});
