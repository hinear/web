import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUserIdByEmailMock,
  getServerProjectsRepositoryMock,
  getAuthenticatedActorIdOrNullMock,
  getRequestOriginMock,
  requireAuthRedirectMock,
  redirectMock,
  sendProjectInvitationEmailMock,
  triggerProjectInvitedNotificationMock,
} = vi.hoisted(() => ({
  findUserIdByEmailMock: vi.fn(),
  getServerProjectsRepositoryMock: vi.fn(),
  getAuthenticatedActorIdOrNullMock: vi.fn(),
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

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import { inviteProjectMemberAction } from "@/features/projects/actions/invite-project-member-action";

describe("inviteProjectMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUserIdByEmailMock.mockResolvedValue("user-22");
    getRequestOriginMock.mockResolvedValue("https://hinear.app");
    sendProjectInvitationEmailMock.mockResolvedValue(true);
    triggerProjectInvitedNotificationMock.mockResolvedValue(undefined);
  });

  it("uses the authenticated actor and request-bound repository", async () => {
    const repository = {
      getProjectById: vi.fn().mockResolvedValue({ name: "Project Alpha" }),
      inviteProjectMember: vi.fn().mockResolvedValue({
        email: "teammate@example.com",
        expiresAt: "2026-04-01T00:00:00.000Z",
        role: "member",
        token: "token-1",
      }),
    };
    const formData = new FormData();

    formData.set("inviteEmail", "Teammate@Example.com");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-11");

    await inviteProjectMemberAction("project-1", formData);

    expect(repository.inviteProjectMember).toHaveBeenCalledWith({
      email: "Teammate@Example.com",
      invitedBy: "user-11",
      projectId: "project-1",
    });
    expect(sendProjectInvitationEmailMock).toHaveBeenCalledWith({
      expiresAt: "2026-04-01T00:00:00.000Z",
      inviteLink: "https://hinear.app/invite/token-1",
      invitedBy: "user-11",
      projectName: "Project Alpha",
      to: "teammate@example.com",
    });
    expect(triggerProjectInvitedNotificationMock).toHaveBeenCalledWith({
      invitedBy: "user-11",
      projectId: "project-1",
      projectName: "Project Alpha",
      role: "member",
      targetUserIds: ["user-22"],
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteSent=1&inviteEmail=Teammate%40Example.com#project-access"
    );
  });

  it("shows a notice when invite creation succeeds but SMTP is not configured", async () => {
    const repository = {
      getProjectById: vi.fn().mockResolvedValue({ name: "Project Alpha" }),
      inviteProjectMember: vi.fn().mockResolvedValue({
        email: "teammate@example.com",
        expiresAt: "2026-04-01T00:00:00.000Z",
        role: "member",
        token: "token-1",
      }),
    };
    const formData = new FormData();

    formData.set("inviteEmail", "teammate@example.com");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-11");
    sendProjectInvitationEmailMock.mockResolvedValue(false);

    await inviteProjectMemberAction("project-1", formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteNotice=Invitation%20created%20for%20teammate%40example.com%2C%20but%20Gmail%20SMTP%20is%20not%20configured.%20Share%20the%20invite%20link%20manually%20from%20the%20pending%20invitations%20list.#project-access"
    );
  });

  it("redirects to auth when the request is unauthenticated", async () => {
    const formData = new FormData();

    formData.set("inviteEmail", "teammate@example.com");

    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    await inviteProjectMemberAction("project-1", formData);

    expect(requireAuthRedirectMock).toHaveBeenCalledWith(
      "/projects/project-1#project-access"
    );
  });

  it("redirects back with a duplicate invitation message", async () => {
    const repository = { inviteProjectMember: vi.fn() };
    const formData = new FormData();

    formData.set("inviteEmail", "teammate@example.com");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-11");
    repository.inviteProjectMember.mockRejectedValue(
      createRepositoryError(
        "PROJECT_INVITATION_EXISTS",
        "A pending invitation already exists for this email."
      )
    );

    await inviteProjectMemberAction("project-1", formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteEmail=teammate%40example.com&inviteError=A+pending+invitation+already+exists+for+this+email.+Resend+or+wait+for+it+to+be+accepted.#project-access"
    );
  });
});
