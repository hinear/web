import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { SupabaseIssuesRepository } from "@/features/issues/repositories/supabase-issues-repository";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableRow } from "@/lib/supabase/types";

type IssuesRow = TableRow<"issues">;
type ActivityLogRow = TableRow<"activity_logs">;

function createFakeIssuesClient(seedIssue: IssuesRow) {
  let issue = { ...seedIssue };
  const activityRows: ActivityLogRow[] = [];

  const client = {
    from(table: string) {
      if (table === "issues") {
        return {
          select() {
            return this;
          },
          update(patch: Partial<IssuesRow>) {
            return {
              eq(column: string, value: unknown) {
                if (column === "id" && value !== issue.id) {
                  return this;
                }

                if (column === "version") {
                  return {
                    select() {
                      return {
                        async maybeSingle() {
                          if (issue.version !== value) {
                            return { data: null, error: null };
                          }

                          issue = {
                            ...issue,
                            ...patch,
                          };

                          return { data: issue, error: null };
                        },
                      };
                    },
                  };
                }

                return this;
              },
            };
          },
          eq(column: string, value: unknown) {
            return {
              async maybeSingle() {
                if (column !== "id" || value !== issue.id) {
                  return { data: null, error: null };
                }

                return { data: issue, error: null };
              },
            };
          },
        };
      }

      if (table === "issue_labels") {
        return {
          select() {
            return {
              eq() {
                return {
                  async in() {
                    return { data: [], error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "labels") {
        return {
          select() {
            return {
              eq() {
                return {
                  async in() {
                    return { data: [], error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "activity_logs") {
        return {
          insert(row: Omit<ActivityLogRow, "id" | "created_at">) {
            const insertedRow: ActivityLogRow = {
              id: `activity-${activityRows.length + 1}`,
              created_at: "2026-03-21T00:00:00.000Z",
              ...row,
            };
            activityRows.push(insertedRow);

            return {
              select() {
                return {
                  async single() {
                    return { data: insertedRow, error: null };
                  },
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return {
    activityRows,
    client: client as unknown as AppSupabaseServerClient,
    getIssue: () => issue,
  };
}

describe("SupabaseIssuesRepository.updateIssue", () => {
  it("increments version when the optimistic lock matches", async () => {
    const seedIssue: IssuesRow = {
      id: "issue-1",
      project_id: "project-1",
      issue_number: 1,
      identifier: "WEB-1",
      title: "Initial title",
      status: "Triage",
      priority: "No Priority",
      assignee_id: null,
      description: "",
      created_by: "user-1",
      updated_by: "user-1",
      created_at: "2026-03-20T00:00:00.000Z",
      updated_at: "2026-03-20T00:00:00.000Z",
      version: 1,
    };
    const fake = createFakeIssuesClient(seedIssue);
    const repository = new SupabaseIssuesRepository(fake.client);

    const result = await repository.updateIssue("issue-1", {
      title: "Updated title",
      updatedBy: "user-2",
      version: 1,
    });

    expect(result.version).toBe(2);
    expect(result.title).toBe("Updated title");
    expect(result.updatedBy).toBe("user-2");
    expect(fake.getIssue().version).toBe(2);
    expect(fake.activityRows).toHaveLength(1);
  });

  it("throws a conflict error when another update already advanced the version", async () => {
    const seedIssue: IssuesRow = {
      id: "issue-1",
      project_id: "project-1",
      issue_number: 1,
      identifier: "WEB-1",
      title: "Initial title",
      status: "Triage",
      priority: "No Priority",
      assignee_id: null,
      description: "",
      created_by: "user-1",
      updated_by: "user-1",
      created_at: "2026-03-20T00:00:00.000Z",
      updated_at: "2026-03-20T00:00:00.000Z",
      version: 1,
    };
    const fake = createFakeIssuesClient(seedIssue);
    const repository = new SupabaseIssuesRepository(fake.client);

    const aliceRead = await repository.getIssueById("issue-1");
    const bobRead = await repository.getIssueById("issue-1");

    expect(aliceRead?.version).toBe(1);
    expect(bobRead?.version).toBe(1);

    await repository.updateIssue("issue-1", {
      title: "Alice title",
      updatedBy: "user-1",
      version: aliceRead!.version,
    });

    await expect(
      repository.updateIssue("issue-1", {
        title: "Bob title",
        updatedBy: "user-2",
        version: bobRead!.version,
      })
    ).rejects.toMatchObject({
      currentVersion: 2,
      requestedVersion: 1,
      type: "CONFLICT",
    });
  });
});
