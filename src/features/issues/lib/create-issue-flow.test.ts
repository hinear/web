import { describe, expect, it, vi } from "vitest";

import type { IssuesRepository } from "@/features/issues/contracts";
import { createIssueFlow } from "@/features/issues/lib/create-issue-flow";

describe("createIssueFlow", () => {
  it("creates a triage issue, appends a creation activity, and returns the detail route", async () => {
    const repository: IssuesRepository = {
      createIssue: vi.fn().mockResolvedValue({
        id: "issue-1",
        projectId: "project-1",
        issueNumber: 1,
        identifier: "WEB-1",
        title: "Add issue detail page",
        status: "Triage",
        priority: "No Priority",
        assigneeId: null,
        description: "Need a full-page route.",
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      }),
      createComment: vi.fn(),
      appendActivityLog: vi.fn().mockResolvedValue({
        id: "activity-1",
        issueId: "issue-1",
        projectId: "project-1",
        actorId: "user-1",
        type: "issue.created",
        field: null,
        from: null,
        to: null,
        summary: "Created issue WEB-1.",
        createdAt: "2026-03-20T00:00:00.000Z",
      }),
      getIssueById: vi.fn(),
    };

    const issuePath = await createIssueFlow(repository, {
      actorId: "user-1",
      projectId: "project-1",
      title: "  Add issue detail page ",
      description: " Need a full-page route. ",
    });

    expect(repository.createIssue).toHaveBeenCalledWith({
      projectId: "project-1",
      title: "Add issue detail page",
      description: "Need a full-page route.",
      assigneeId: null,
      createdBy: "user-1",
    });
    expect(repository.appendActivityLog).toHaveBeenCalledWith({
      issueId: "issue-1",
      projectId: "project-1",
      actorId: "user-1",
      type: "issue.created",
      field: null,
      from: null,
      to: null,
      summary: "Created issue WEB-1.",
    });
    expect(issuePath).toBe("/projects/project-1/issues/issue-1");
  });
});
