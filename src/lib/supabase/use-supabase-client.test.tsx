import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserSupabaseClientMock } = vi.hoisted(() => ({
  createBrowserSupabaseClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/browser-client", () => ({
  createBrowserSupabaseClient: createBrowserSupabaseClientMock,
}));

import { useSupabaseClient } from "@/lib/supabase/use-supabase-client";

describe("useSupabaseClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the browser client once and reuses it across rerenders", () => {
    const client = { from: vi.fn() };
    createBrowserSupabaseClientMock.mockReturnValue(client);

    const { result, rerender } = renderHook(() => useSupabaseClient());

    rerender();

    expect(createBrowserSupabaseClientMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(client);
  });
});
