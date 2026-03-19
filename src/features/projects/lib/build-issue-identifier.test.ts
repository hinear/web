import { describe, expect, it } from "vitest";

import { buildIssueIdentifier } from "@/features/projects/lib/build-issue-identifier";

describe("buildIssueIdentifier", () => {
  it("builds a project-scoped issue identifier", () => {
    expect(buildIssueIdentifier("web", 12)).toBe("WEB-12");
  });

  it("rejects invalid project keys", () => {
    expect(() => buildIssueIdentifier("web-app", 1)).toThrowError(
      "Project key must contain only uppercase letters and numbers.",
    );
  });

  it("rejects non-positive sequences", () => {
    expect(() => buildIssueIdentifier("WEB", 0)).toThrowError(
      "Issue sequence must be a positive integer.",
    );
  });
});
