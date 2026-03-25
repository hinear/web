import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createRequestSupabaseServerClientMock,
  getAuthenticatedActorIdOrNullMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  createRequestSupabaseServerClientMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

vi.mock(
  "@/features/notifications/repositories/supabase-push-subscriptions-repository",
  () => ({
    SupabasePushSubscriptionsRepository: class {
      unsubscribe = unsubscribeMock;
    },
  })
);

import { DELETE } from "@/app/api/notifications/unsubscribe/route";

describe("DELETE /api/notifications/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRequestSupabaseServerClientMock.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await DELETE(
      new Request("https://hinear.test/api/notifications/unsubscribe", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("requires an endpoint", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await DELETE(
      new Request("https://hinear.test/api/notifications/unsubscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "endpoint is required",
    });
  });

  it("unsubscribes the endpoint for the authenticated actor", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    unsubscribeMock.mockResolvedValue(true);

    const response = await DELETE(
      new Request("https://hinear.test/api/notifications/unsubscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: "https://push.example.com/sub/1" }),
      })
    );

    expect(unsubscribeMock).toHaveBeenCalledWith(
      "user-1",
      "https://push.example.com/sub/1"
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
    });
  });
});
