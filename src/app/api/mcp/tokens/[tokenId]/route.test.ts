import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createRequestSupabaseServerClientMock,
  getAuthenticatedActorIdOrNullMock,
  updateMock,
  eqMock,
  isMock,
  selectMock,
  maybeSingleMock,
} = vi.hoisted(() => ({
  createRequestSupabaseServerClientMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  isMock: vi.fn(),
  selectMock: vi.fn(),
  maybeSingleMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

import { DELETE } from "@/app/api/mcp/tokens/[tokenId]/route";

describe("/api/mcp/tokens/[tokenId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    maybeSingleMock.mockResolvedValue({
      data: { id: "token-1" },
      error: null,
    });

    selectMock.mockReturnValue({
      maybeSingle: maybeSingleMock,
    });

    isMock.mockReturnValue({
      select: selectMock,
    });

    eqMock.mockReturnValue({
      eq: eqMock,
      is: isMock,
    });

    updateMock.mockReturnValue({
      eq: eqMock,
    });

    createRequestSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        update: updateMock,
      })),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await DELETE(new Request("https://hinear.test"), {
      params: Promise.resolve({ tokenId: "token-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("revokes the selected token", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await DELETE(new Request("https://hinear.test"), {
      params: Promise.resolve({ tokenId: "token-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      tokenId: "token-1",
    });
  });
});
