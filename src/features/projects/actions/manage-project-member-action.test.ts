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

vi.mock("@/features/auth/actions/require-auth-redirect", () => ({
  requireAuthRedirect: requireAuthRedirectMock,
}));

vi.mock("@/features/projects/repositories/server-projects-repository", () => ({
  getServerProjectsRepository: getServerProjectsRepositoryMock,
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

import { manageProjectMemberAction } from "@/features/projects/actions/manage-project-member-action";

describe("manageProjectMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects guests to auth", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    await manageProjectMemberAction("project-1", new FormData());

    expect(requireAuthRedirectMock).toHaveBeenCalledWith(
      "/projects/project-1#project-access"
    );
  });

  it("blocks non-owner removals", async () => {
    const repository = {
      listProjectMembers: vi.fn().mockResolvedValue([
        {
          id: "user-1",
          name: "Alex",
          role: "owner",
          note: "Owner since Mar 20",
          canRemove: false,
        },
        {
          id: "user-2",
          name: "Jordan",
          role: "member",
          note: "Joined Mar 20",
          canRemove: true,
        },
      ]),
      removeProjectMember: vi.fn(),
    };
    const formData = new FormData();

    formData.set("memberId", "user-1");
    formData.set("memberName", "Alex");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-2");

    await manageProjectMemberAction("project-1", formData);

    expect(repository.removeProjectMember).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteError=Only+project+owners+can+remove+members.#project-access"
    );
  });

  it("removes a member and redirects with a notice", async () => {
    const repository = {
      listProjectMembers: vi.fn().mockResolvedValue([
        {
          id: "user-1",
          name: "Alex",
          role: "owner",
          note: "Owner since Mar 20",
          canRemove: false,
        },
        {
          id: "user-2",
          name: "Jordan",
          role: "member",
          note: "Joined Mar 20",
          canRemove: true,
        },
      ]),
      removeProjectMember: vi.fn().mockResolvedValue(undefined),
    };
    const formData = new FormData();

    formData.set("memberId", "user-2");
    formData.set("memberName", "Jordan");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    await manageProjectMemberAction("project-1", formData);

    expect(repository.removeProjectMember).toHaveBeenCalledWith(
      "project-1",
      "user-2"
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1?inviteNotice=Jordan+was+removed+from+the+project.#project-access"
    );
  });
});
