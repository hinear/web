import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUserIdByEmailMock,
  getServerProjectsRepositoryMock,
  getAuthenticatedActorIdOrNullMock,
  getAuthenticatedUserOrNullMock,
  getRequestOriginMock,
  requireAuthRedirectMock,
  redirectMock,
  sendProjectInvitationEmailMock,
  triggerProjectInvitedNotificationMock,
} = vi.hoisted(() => ({
  findUserIdByEmailMock: vi.fn(),
  getServerProjectsRepositoryMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
  getAuthenticatedUserOrNullMock: vi.fn(),
  getRequestOriginMock: vi.fn(),
  requireAuthRedirectMock: vi.fn(),
  redirectMock: vi.fn(),
  sendProjectInvitationEmailMock: vi.fn(),
  triggerProjectInvitedNotificationMock: vi.fn(),
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
  getAuthenticatedUserOrNull: getAuthenticatedUserOrNullMock,
}));

vi.mock("@/lib/request-origin", () => ({
  getRequestOrigin: getRequestOriginMock,
}));

vi.mock("@/lib/email/send-project-invitation-email", () => ({
  sendProjectInvitationEmail: sendProjectInvitationEmailMock,
}));

vi.mock("@/lib/notifications/find-user-id-by-email", () => ({
  findUserIdByEmail: findUserIdByEmailMock,
}));

vi.mock("@/lib/notifications/triggers", () => ({
  triggerProjectInvitedNotification: triggerProjectInvitedNotificationMock,
}));

import { manageProjectInvitationAction } from "@/features/projects/actions/manage-project-invitation-action";

describe("manageProjectInvitationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUserIdByEmailMock.mockResolvedValue("user-22");
    getRequestOriginMock.mockResolvedValue("https://hinear.app");
    getAuthenticatedUserOrNullMock.mockResolvedValue({
      email: "owner@example.com",
      user_metadata: { full_name: "Owner Name" },
    });
    sendProjectInvitationEmailMock.mockResolvedValue(true);
    triggerProjectInvitedNotificationMock.mockResolvedValue(undefined);
  });

  it("resends an invitation and redirects with a notice", async () => {
    const repository = {
      getProjectById: vi.fn().mockResolvedValue({ name: "Project Alpha" }),
      resendProjectInvitation: vi.fn().mockResolvedValue({
        email: "pending@example.com",
        expiresAt: "2026-04-01T00:00:00.000Z",
        role: "member",
        token: "token-2",
      }),
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
    expect(sendProjectInvitationEmailMock).toHaveBeenCalledWith({
      expiresAt: "2026-04-01T00:00:00.000Z",
      inviteLink: "https://hinear.app/invite/token-2",
      invitedBy: "Owner Name",
      projectName: "Project Alpha",
      to: "pending@example.com",
    });
    expect(triggerProjectInvitedNotificationMock).toHaveBeenCalledWith({
      invitedBy: "user-1",
      projectId: "project-1",
      projectName: "Project Alpha",
      role: "member",
      targetUserIds: ["user-22"],
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteNotice=Invitation%20resent%20to%20pending%40example.com.#project-access"
    );
  });

  it("shows a notice when resend succeeds but SMTP is not configured", async () => {
    const repository = {
      getProjectById: vi.fn().mockResolvedValue({ name: "Project Alpha" }),
      resendProjectInvitation: vi.fn().mockResolvedValue({
        email: "pending@example.com",
        expiresAt: "2026-04-01T00:00:00.000Z",
        role: "member",
        token: "token-2",
      }),
      revokeProjectInvitation: vi.fn(),
    };
    const formData = new FormData();

    formData.set("invitationAction", "resend");
    formData.set("invitationEmail", "pending@example.com");
    formData.set("invitationId", "invitation-1");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");
    sendProjectInvitationEmailMock.mockResolvedValue(false);

    await manageProjectInvitationAction("project-1", formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteNotice=Invitation%20was%20refreshed%20for%20pending%40example.com%2C%20but%20Gmail%20SMTP%20is%20not%20configured.%20Share%20the%20invite%20link%20manually%20from%20the%20pending%20invitations%20list.#project-access"
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
