import { describe, expect, it } from "vitest";

import {
  createIssueDraft,
  isIssueCreationReady,
} from "@/features/issues/lib/create-issue";

describe("createIssueDraft", () => {
  it("normalizes optional issue fields for insertion", () => {
    expect(
      createIssueDraft({
        projectId: "project-1",
        title: "  Add invite acceptance flow  ",
        description: "  Accept token and create member row  ",
        createdBy: "user-1",
      })
    ).toEqual({
      assigneeId: null,
      createdBy: "user-1",
      description: "Accept token and create member row",
      labels: [],
      priority: "No Priority",
      projectId: "project-1",
      status: "Triage",
      title: "Add invite acceptance flow",
    });
  });

  it("rejects an empty issue title", () => {
    expect(() =>
      createIssueDraft({
        projectId: "project-1",
        title: "   ",
        createdBy: "user-1",
      })
    ).toThrowError("Issue title is required.");
  });

  it("keeps explicit status and priority when provided", () => {
    expect(
      createIssueDraft({
        createdBy: "user-1",
        priority: "High",
        projectId: "project-1",
        status: "In Progress",
        title: "Improve issue create flow",
      })
    ).toMatchObject({
      priority: "High",
      status: "In Progress",
    });
  });

  it("normalizes and deduplicates labels", () => {
    expect(
      createIssueDraft({
        createdBy: "user-1",
        labels: [" UI ", "docs", "ui", " docs "],
        projectId: "project-1",
        title: "Improve issue create flow",
      })
    ).toMatchObject({
      labels: ["UI", "docs"],
    });
  });
});

describe("isIssueCreationReady", () => {
  it("matches the expected database defaults for a new issue", () => {
    expect(
      isIssueCreationReady({
        status: "Triage",
        priority: "No Priority",
      })
    ).toBe(true);
  });

  it("returns false when defaults drift", () => {
    expect(
      isIssueCreationReady({
        status: "Todo",
        priority: "No Priority",
      })
    ).toBe(false);
  });
});
