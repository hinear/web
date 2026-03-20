import { describe, expect, it } from "vitest";

import { toBoardIssue } from "@/features/issues/lib/issue-contract-adapter";
import type { Issue } from "@/features/issues/types";

describe("toBoardIssue", () => {
  it("maps a domain issue into the board contract shape", () => {
    const issue: Issue = {
      id: "issue-1",
      projectId: "project-1",
      issueNumber: 7,
      identifier: "WEB-7",
      title: "Connect board to Supabase",
      status: "In Progress",
      priority: "High",
      assigneeId: "user-1",
      labels: [{ id: "label-1", name: "Backend", color: "#2563EB" }],
      description: "Use one issue source across create, board, and detail.",
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: "2026-03-20T00:00:00.000Z",
      updatedAt: "2026-03-20T01:00:00.000Z",
      version: 4,
    };

    expect(toBoardIssue(issue)).toEqual({
      id: "issue-1",
      identifier: "WEB-7",
      title: "Connect board to Supabase",
      status: "In Progress",
      priority: "High",
      assignee: {
        id: "user-1",
        name: "Assigned",
      },
      labels: [{ id: "label-1", name: "Backend", color: "#2563EB" }],
      description: "Use one issue source across create, board, and detail.",
      comments: [],
      activityLog: [],
      createdAt: "2026-03-20T00:00:00.000Z",
      updatedAt: "2026-03-20T01:00:00.000Z",
    });
  });
});
