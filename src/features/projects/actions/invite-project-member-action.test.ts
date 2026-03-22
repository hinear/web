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

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import { inviteProjectMemberAction } from "@/features/projects/actions/invite-project-member-action";

describe("inviteProjectMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the authenticated actor and request-bound repository", async () => {
    const repository = { inviteProjectMember: vi.fn().mockResolvedValue({}) };
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
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteSent=1&inviteEmail=Teammate%40Example.com#project-access"
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
