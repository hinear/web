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
      }),
    ).toEqual({
      projectId: "project-1",
      title: "Add invite acceptance flow",
      description: "Accept token and create member row",
      assigneeId: null,
      createdBy: "user-1",
    });
  });

  it("rejects an empty issue title", () => {
    expect(() =>
      createIssueDraft({
        projectId: "project-1",
        title: "   ",
        createdBy: "user-1",
      }),
    ).toThrowError("Issue title is required.");
  });
});

describe("isIssueCreationReady", () => {
  it("matches the expected database defaults for a new issue", () => {
    expect(
      isIssueCreationReady({
        status: "Triage",
        priority: "No Priority",
      }),
    ).toBe(true);
  });

  it("returns false when defaults drift", () => {
    expect(
      isIssueCreationReady({
        status: "Todo",
        priority: "No Priority",
      }),
    ).toBe(false);
  });
});
