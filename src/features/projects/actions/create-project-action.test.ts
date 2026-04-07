import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createProjectFlowMock,
  getServerProjectsRepositoryMock,
  getAuthenticatedActorIdOrNullMock,
  requireAuthRedirectMock,
  redirectMock,
} = vi.hoisted(() => ({
  createProjectFlowMock: vi.fn(),
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

vi.mock("@/features/projects/lib/create-project-flow", () => ({
  createProjectFlow: createProjectFlowMock,
}));

vi.mock("@/features/projects/repositories/server-projects-repository", () => ({
  getServerProjectsRepository: getServerProjectsRepositoryMock,
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import { createProjectAction } from "@/features/projects/actions/create-project-action";

describe("createProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the authenticated actor and request-bound repository", async () => {
    const repository = { createProject: vi.fn() };
    const formData = new FormData();

    formData.set("name", "Web Platform");
    formData.set("key", "web");
    formData.set("type", "team");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-11");
    createProjectFlowMock.mockResolvedValue("/projects/project-3");

    await createProjectAction(formData);

    expect(getAuthenticatedActorIdOrNullMock).toHaveBeenCalledTimes(1);
    expect(getServerProjectsRepositoryMock).toHaveBeenCalledTimes(1);
    expect(createProjectFlowMock).toHaveBeenCalledWith(repository, {
      actorId: "user-11",
      key: "web",
      name: "Web Platform",
      type: "team",
    });
    expect(redirectMock).toHaveBeenCalledWith("/projects/project-3");
  });

  it("redirects to auth when the request is unauthenticated", async () => {
    const formData = new FormData();

    formData.set("name", "Web Platform");
    formData.set("key", "web");

    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    await createProjectAction(formData);

    expect(requireAuthRedirectMock).toHaveBeenCalledWith("/projects/new");
    expect(createProjectFlowMock).not.toHaveBeenCalled();
  });

  it("redirects back to the form with a duplicate-key message", async () => {
    const repository = { createProject: vi.fn() };
    const formData = new FormData();

    formData.set("name", "Web Platform");
    formData.set("key", "web");
    formData.set("type", "team");

    getServerProjectsRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-11");
    createProjectFlowMock.mockRejectedValue(
      createRepositoryError("PROJECT_KEY_TAKEN", "Project key already exists.")
    );

    await createProjectAction(formData);

    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/new?error=That+project+key+is+already+in+use.+Choose+a+different+key."
    );
  });
});
