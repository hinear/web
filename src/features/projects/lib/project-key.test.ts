import { describe, expect, it } from "vitest";

import {
  assertProjectKey,
  isValidProjectKey,
  normalizeProjectKey,
} from "@/features/projects/lib/project-key";

describe("projectKey", () => {
  it("normalizes keys to trimmed uppercase values", () => {
    expect(normalizeProjectKey(" web12 ")).toBe("WEB12");
  });

  it("accepts uppercase alphanumeric project keys", () => {
    expect(isValidProjectKey("WEB12")).toBe(true);
  });

  it("rejects keys with separators", () => {
    expect(isValidProjectKey("WEB-APP")).toBe(false);
  });

  it("throws for invalid project keys", () => {
    expect(() => assertProjectKey("1WEB")).toThrowError(
      "Project key must contain only uppercase letters and numbers.",
    );
  });
});
