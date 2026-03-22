import { describe, expect, it } from "vitest";

import {
  getIssuePath,
  getProjectDashboardPath,
  getProjectIssueCreatePath,
  getProjectPath,
  getProjectSettingsPath,
} from "@/features/projects/lib/paths";

describe("project paths", () => {
  it("builds the canonical project routes", () => {
    expect(getProjectPath("project-1")).toBe("/projects/project-1");
    expect(getProjectDashboardPath("project-1")).toBe(
      "/projects/project-1/dashboard"
    );
    expect(getProjectSettingsPath("project-1")).toBe(
      "/projects/project-1/settings"
    );
    expect(getProjectIssueCreatePath("project-1")).toBe(
      "/projects/project-1/issues/new"
    );
    expect(getIssuePath("project-1", "issue-9")).toBe(
      "/projects/project-1/issues/issue-9"
    );
  });
});
