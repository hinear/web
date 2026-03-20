import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createIssueFlowMock,
  getServerIssuesRepositoryMock,
  getAuthenticatedActorIdOrNullMock,
  requireAuthRedirectMock,
  redirectMock,
} = vi.hoisted(() => ({
  createIssueFlowMock: vi.fn(),
  getServerIssuesRepositoryMock: vi.fn(),
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

vi.mock("@/features/issues/lib/create-issue-flow", () => ({
  createIssueFlow: createIssueFlowMock,
}));

vi.mock("@/features/issues/repositories/server-issues-repository", () => ({
  getServerIssuesRepository: getServerIssuesRepositoryMock,
}));

vi.mock("@/lib/supabase/server-auth", () => ({
  getAuthenticatedActorIdOrNull: getAuthenticatedActorIdOrNullMock,
}));

import { createIssueAction } from "@/features/issues/actions/create-issue-action";

describe("createIssueAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the authenticated actor and request-bound repository", async () => {
    const repository = { createIssue: vi.fn() };
    const formData = new FormData();

    formData.set("title", "Add auth-bound writes");
    formData.set("description", "Move actor lookup into Supabase auth.");
    formData.set("labels", "Auth, Backend, auth");
    formData.set("status", "Backlog");
    formData.set("priority", "High");
    formData.set("assigneeId", "user-9");

    getServerIssuesRepositoryMock.mockResolvedValue(repository);
    getAuthenticatedActorIdOrNullMock.mockResolvedValue("user-42");
    createIssueFlowMock.mockResolvedValue("/projects/project-1/issues/issue-7");

    await createIssueAction("project-1", formData);

    expect(getAuthenticatedActorIdOrNullMock).toHaveBeenCalledTimes(1);
    expect(getServerIssuesRepositoryMock).toHaveBeenCalledTimes(1);
    expect(createIssueFlowMock).toHaveBeenCalledWith(repository, {
      actorId: "user-42",
      assigneeId: "user-9",
      description: "Move actor lookup into Supabase auth.",
      labels: ["Auth", "Backend"],
      priority: "High",
      projectId: "project-1",
      status: "Backlog",
      title: "Add auth-bound writes",
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/projects/project-1/issues/issue-7"
    );
  });

  it("redirects to auth when the request is unauthenticated", async () => {
    const formData = new FormData();

    formData.set("title", "Add auth");

    getAuthenticatedActorIdOrNullMock.mockResolvedValue(null);

    await createIssueAction("project-1", formData);

    expect(requireAuthRedirectMock).toHaveBeenCalledWith(
      "/projects/project-1#new-issue-form"
    );
    expect(createIssueFlowMock).not.toHaveBeenCalled();
  });
});
