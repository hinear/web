import { describe, expect, it, vi } from "vitest";

import type { ProjectsRepository } from "@/features/projects/contracts";
import { createProjectFlow } from "@/features/projects/lib/create-project-flow";

describe("createProjectFlow", () => {
  it("creates an owner-backed project and returns the project route", async () => {
    const repository: ProjectsRepository = {
      createProject: vi.fn().mockResolvedValue({
        id: "project-1",
        key: "WEB",
        name: "Web Platform",
        type: "team",
        issueSeq: 0,
        createdBy: "user-1",
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      }),
      addProjectMember: vi.fn().mockResolvedValue({
        projectId: "project-1",
        userId: "user-1",
        role: "owner",
        createdAt: "2026-03-20T00:00:00.000Z",
      }),
      inviteProjectMember: vi.fn(),
      getProjectById: vi.fn(),
    };

    const projectPath = await createProjectFlow(repository, {
      actorId: "user-1",
      key: " web ",
      name: "  Web Platform ",
      type: "team",
    });

    expect(repository.createProject).toHaveBeenCalledWith({
      key: "WEB",
      name: "Web Platform",
      type: "team",
      createdBy: "user-1",
    });
    expect(repository.addProjectMember).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        userId: "user-1",
        role: "owner",
      })
    );
    expect(projectPath).toBe("/projects/project-1");
  });
});
