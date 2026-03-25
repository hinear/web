import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createRequestSupabaseServerClientMock,
  getAuthenticatedActorIdOrNullMock,
  getPreferencesMock,
  updatePreferencesMock,
} = vi.hoisted(() => ({
  createRequestSupabaseServerClientMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  getPreferencesMock: vi.fn(),
  updatePreferencesMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: createRequestSupabaseServerClientMock,
}));

vi.mock(
  "@/features/notifications/repositories/supabase-notification-preferences-repository",
  () => ({
    SupabaseNotificationPreferencesRepository: class {
      getPreferences = getPreferencesMock;
      updatePreferences = updatePreferencesMock;
    },
  })
);

import { GET, PATCH } from "@/app/api/notifications/preferences/route";

describe("/api/notifications/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRequestSupabaseServerClientMock.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("returns preferences for the authenticated actor", async () => {
    const preferences = {
      user_id: "user-1",
      issue_assigned: true,
      issue_status_changed: false,
      comment_added: true,
      project_invited: true,
      created_at: "2026-03-25T00:00:00.000Z",
      updated_at: "2026-03-25T00:00:00.000Z",
    };

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getPreferencesMock.mockResolvedValue(preferences);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      preferences,
    });
  });

  it("updates allowed preference fields", async () => {
    const updatedPreferences = {
      user_id: "user-1",
      issue_assigned: false,
      issue_status_changed: true,
      comment_added: true,
      project_invited: true,
      created_at: "2026-03-25T00:00:00.000Z",
      updated_at: "2026-03-25T01:00:00.000Z",
    };

    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    getPreferencesMock.mockResolvedValue(updatedPreferences);
    updatePreferencesMock.mockResolvedValue(updatedPreferences);

    const response = await PATCH(
      new Request("https://hinear.test/api/notifications/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ issue_assigned: false }),
      })
    );

    expect(getPreferencesMock).toHaveBeenCalledWith("user-1");
    expect(updatePreferencesMock).toHaveBeenCalledWith("user-1", {
      issue_assigned: false,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      preferences: updatedPreferences,
    });
  });

  it("rejects invalid payload keys", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("https://hinear.test/api/notifications/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bad_key: true }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid notification preferences payload",
    });
  });
});
