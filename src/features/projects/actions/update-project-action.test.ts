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
import { updateProjectAction } from "@/features/projects/actions/update-project-action";

describe("updateProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects guests to auth", async () => {
    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    await updateProjectAction("project-1", new FormData());

    expect(requireAuthRedirectMock).toHaveBeenCalledWith(
      "/projects/project-1/settings"
    );
  });

  it("updates project details for owners", async () => {
    const repository = {
      listProjectMembers: vi.fn().mockResolvedValue([
        {
          id: "user-1",
          name: "Alex",
          role: "owner",
          note: "Owner since Mar 20",
          canRemove: false,
        },
      ]),
      updateProject: vi.fn().mockResolvedValue({}),
    };
    const formData = new FormData();

    formData.set("name", "Ops Workspace");
    formData.set("key", "ops");
    formData.set("type", "personal");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    await updateProjectAction("project-1", formData);

    expect(repository.updateProject).toHaveBeenCalledWith({
      key: "OPS",
      name: "Ops Workspace",
      projectId: "project-1",
      type: "personal",
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1/settings?projectNotice=Project+details+updated."
    );
  });

  it("redirects back with duplicate key messaging", async () => {
    const repository = {
      listProjectMembers: vi.fn().mockResolvedValue([
        {
          id: "user-1",
          name: "Alex",
          role: "owner",
          note: "Owner since Mar 20",
          canRemove: false,
        },
      ]),
      updateProject: vi
        .fn()
        .mockRejectedValue(
          createRepositoryError(
            "PROJECT_KEY_TAKEN",
            "Project key already exists."
          )
        ),
    };
    const formData = new FormData();

    formData.set("name", "Ops Workspace");
    formData.set("key", "ops");
    formData.set("type", "personal");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    await updateProjectAction("project-1", formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1/settings?projectError=That+project+key+is+already+in+use.+Choose+a+different+key."
    );
  });

  it("blocks switching to personal while shared access remains", async () => {
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
      updateProject: vi.fn(),
    };
    const formData = new FormData();

    formData.set("name", "Ops Workspace");
    formData.set("key", "ops");
    formData.set("type", "personal");
    formData.set("pendingInvitationCount", "1");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    await updateProjectAction("project-1", formData);

    expect(repository.updateProject).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1/settings?projectError=Remove+other+members+and+clear+pending+invitations+before+switching+to+a+personal+project."
    );
  });

  it("uses update-specific forbidden messaging", async () => {
    const repository = {
      listProjectMembers: vi.fn().mockResolvedValue([
        {
          id: "user-1",
          name: "Alex",
          role: "owner",
          note: "Owner since Mar 20",
          canRemove: false,
        },
      ]),
      updateProject: vi
        .fn()
        .mockRejectedValue(
          createRepositoryError("FORBIDDEN", "permission denied")
        ),
    };
    const formData = new FormData();

    formData.set("name", "Ops Workspace");
    formData.set("key", "ops");
    formData.set("type", "personal");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-1");

    await updateProjectAction("project-1", formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1/settings?projectError=You+do+not+have+permission+to+update+this+project+right+now."
    );
  });
});
