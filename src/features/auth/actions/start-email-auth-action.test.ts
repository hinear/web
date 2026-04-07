import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getRequestOriginMock,
  redirectMock,
  signInWithOAuthMock,
  signInWithOtpMock,
} = vi.hoisted(() => ({
  getRequestOriginMock: vi.fn(),
  redirectMock: vi.fn(),
  signInWithOAuthMock: vi.fn(),
  signInWithOtpMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/request-origin", () => ({
  getRequestOrigin: getRequestOriginMock,
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createRequestSupabaseServerClient: async () => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
      signInWithOtp: signInWithOtpMock,
    },
  }),
  createServerSupabaseClient: () => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
      signInWithOtp: signInWithOtpMock,
    },
  }),
}));

import { requireAuthRedirect } from "@/features/auth/actions/require-auth-redirect";
import { startEmailAuthAction } from "@/features/auth/actions/start-email-auth";
import { startGoogleAuthAction } from "@/features/auth/actions/start-google-auth";

describe("startEmailAuthAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts magic link auth and redirects to sent state", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("next", "/projects/new");
    formData.set("reason", "auth_required");

    getRequestOriginMock.mockResolvedValue("https://hinear.test");
    signInWithOtpMock.mockResolvedValue({ error: null });

    await startEmailAuthAction(formData);

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "test@example.com",
      options: {
        emailRedirectTo:
          "https://hinear.test/auth/confirm?next=%2Fprojects%2Fnew",
        shouldCreateUser: true,
      },
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth?next=%2Fprojects%2Fnew&reason=auth_required&email=test%40example.com&sent=1"
    );
  });

  it("redirects back with an auth error message", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("next", "/projects/proj-1");
    formData.set("reason", "session_expired");

    getRequestOriginMock.mockResolvedValue("https://hinear.test");
    signInWithOtpMock.mockResolvedValue({
      error: { message: "Invalid login." },
    });

    await startEmailAuthAction(formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/auth?next=%2Fprojects%2Fproj-1&reason=session_expired&email=test%40example.com&error=Invalid+login."
    );
  });

  it("requires auth and redirects with reason", async () => {
    await requireAuthRedirect("/projects/test", "session_expired");

    expect(redirectMock).toHaveBeenCalledWith(
      "/auth?next=%2Fprojects%2Ftest&reason=session_expired"
    );
  });

  it("starts Google auth with the configured confirm callback", async () => {
    const formData = new FormData();
    formData.set("next", "/projects/new");
    formData.set("reason", "auth_required");

    getRequestOriginMock.mockResolvedValue("https://hinear.test");
    signInWithOAuthMock.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/v2/auth" },
      error: null,
    });

    await startGoogleAuthAction(formData);

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      options: {
        redirectTo: "https://hinear.test/auth/confirm?next=%2Fprojects%2Fnew",
      },
      provider: "google",
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
  });

  it("redirects back to auth when Google auth setup fails", async () => {
    const formData = new FormData();
    formData.set("next", "/projects/new");

    getRequestOriginMock.mockResolvedValue("https://hinear.test");
    signInWithOAuthMock.mockResolvedValue({
      data: { url: null },
      error: { message: "oauth failed" },
    });

    await startGoogleAuthAction(formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/auth?next=%2Fprojects%2Fnew&error=Google+login+could+not+be+started."
    );
  });
});
