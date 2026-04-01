import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createRequestSupabaseServerClientMock,
  getAuthenticatedActorIdOrNullMock,
  selectMock,
  orderMock,
  insertMock,
  singleMock,
} = vi.hoisted(() => ({
  createRequestSupabaseServerClientMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  selectMock: vi.fn(),
  orderMock: vi.fn(),
  insertMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

import { GET, POST } from "@/app/api/mcp/tokens/route";

describe("/api/mcp/tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    orderMock.mockResolvedValue({
      data: [],
      error: null,
    });

    singleMock.mockResolvedValue({
      data: {
        id: "token-1",
        name: "My MCP token",
        created_at: "2026-04-01T00:00:00.000Z",
        last_used_at: null,
        expires_at: "2026-05-01T00:00:00.000Z",
        revoked_at: null,
      },
      error: null,
    });

    insertMock.mockReturnValue({
      select: selectMock,
    });

    selectMock.mockReturnValue({
      order: orderMock,
      single: singleMock,
    });

    createRequestSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        insert: insertMock,
        select: selectMock,
      })),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns token summaries for the authenticated user", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      tokens: [],
    });
  });

  it("creates a token and returns the raw value once", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("https://hinear.test/api/mcp/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresInDays: 30,
          name: "CLI token",
        }),
      })
    );

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.tokenRecord.name).toBe("My MCP token");
    expect(payload.token.startsWith("hinear_mcp_")).toBe(true);
  });

  it("rejects invalid token payloads", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("https://hinear.test/api/mcp/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresInDays: 7,
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid MCP token payload",
    });
  });
});
