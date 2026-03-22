import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerProjectsRepositoryMock,
  getAuthenticatedActorIdOrNullMock,
  requireAuthRedirectMock,
  redirectMock,
} = vi.hoisted(() => ({
  getServerProjectsRepositoryMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  requireAuthRedirectMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/features/auth/actions/start-email-auth-action", () => ({
  requireAuthRedirect: requireAuthRedirectMock,
}));

vi.mock("@/features/projects/repositories/server-projects-repository", () => ({
  getServerProjectsRepository: getServerProjectsRepositoryMock,
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

import { manageProjectInvitationAction } from "@/features/projects/actions/manage-project-invitation-action";

describe("manageProjectInvitationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resends an invitation and redirects with a notice", async () => {
    const repository = {
      resendProjectInvitation: vi.fn().mockResolvedValue({}),
      revokeProjectInvitation: vi.fn(),
    };
    const formData = new FormData();

    formData.set("invitationAction", "resend");
    formData.set("invitationEmail", "pending@example.com");
    formData.set("invitationId", "invitation-1");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    await manageProjectInvitationAction("project-1", formData);

    expect(repository.resendProjectInvitation).toHaveBeenCalledWith(
      "invitation-1"
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteNotice=Invitation%20resent%20to%20pending%40example.com.#project-access"
    );
  });

  it("revokes an invitation and redirects with a notice", async () => {
    const repository = {
      resendProjectInvitation: vi.fn(),
      revokeProjectInvitation: vi.fn().mockResolvedValue({}),
    };
    const formData = new FormData();

    formData.set("invitationAction", "revoke");
    formData.set("invitationEmail", "pending@example.com");
    formData.set("invitationId", "invitation-1");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    await manageProjectInvitationAction("project-1", formData);

    expect(repository.revokeProjectInvitation).toHaveBeenCalledWith(
      "invitation-1"
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteNotice=Invitation%20revoked%20for%20pending%40example.com.#project-access"
    );
  });
});
