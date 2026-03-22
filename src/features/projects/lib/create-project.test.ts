import { describe, expect, it, vi } from "vitest";

import type { ProjectsRepository } from "@/features/projects/contracts";
import {
  createInitialProjectMembership,
  createProjectDraft,
  createProjectWithOwner,
} from "@/features/projects/lib/create-project";

describe("createProjectDraft", () => {
  it("normalizes the key and trims the name", () => {
    expect(
      createProjectDraft({
        key: " web ",
        name: "  Frontend Platform  ",
        type: "team",
        createdBy: "user-1",
      })
    ).toEqual({
      key: "WEB",
      name: "Frontend Platform",
      type: "team",
      createdBy: "user-1",
    });
  });

  it("rejects an empty project name", () => {
    expect(() =>
      createProjectDraft({
        key: "WEB",
        name: "   ",
        type: "team",
        createdBy: "user-1",
      })
    ).toThrowError("Project name is required.");
  });
});

describe("createInitialProjectMembership", () => {
  it("creates an owner membership for the creator", () => {
    expect(createInitialProjectMembership("project-1", "user-1")).toMatchObject(
      {
        projectId: "project-1",
        userId: "user-1",
        role: "owner",
      }
    );
  });
});

describe("createProjectWithOwner", () => {
  it("creates the project and its owner membership", async () => {
    const repository: ProjectsRepository = {
      createProject: vi.fn().mockResolvedValue({
        id: "project-1",
        key: "WEB",
        name: "Frontend Platform",
        type: "team",
        issueSeq: 0,
        createdBy: "user-1",
        createdAt: "2026-03-19T00:00:00.000Z",
        updatedAt: "2026-03-19T00:00:00.000Z",
      }),
      addProjectMember: vi.fn().mockResolvedValue({
        projectId: "project-1",
        userId: "user-1",
        role: "owner",
        createdAt: "2026-03-19T00:00:00.000Z",
      }),
      inviteProjectMember: vi.fn(),
      updateProject: vi.fn(),
      getProjectById: vi.fn(),
      listPendingProjectInvitations: vi.fn(),
      listProjectMembers: vi.fn(),
      removeProjectMember: vi.fn(),
      resendProjectInvitation: vi.fn(),
      revokeProjectInvitation: vi.fn(),
    };

    const project = await createProjectWithOwner(repository, {
      key: "web",
      name: "Frontend Platform",
      type: "team",
      createdBy: "user-1",
    });

    expect(repository.createProject).toHaveBeenCalledWith({
      key: "WEB",
      name: "Frontend Platform",
      type: "team",
      createdBy: "user-1",
    });
    expect(repository.addProjectMember).not.toHaveBeenCalled();
    expect(project.id).toBe("project-1");
  });
});
