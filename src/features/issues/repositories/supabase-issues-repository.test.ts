import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const githubSyncMocks = vi.hoisted(() => ({
  syncIssueToGitHub: vi.fn().mockResolvedValue(null),
  updateGitHubIssue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/github/sync-service", () => ({
  GitHubSyncService: class {
    syncIssueToGitHub = githubSyncMocks.syncIssueToGitHub;
    updateGitHubIssue = githubSyncMocks.updateGitHubIssue;
  },
}));

import { createLabelKey } from "@/features/issues/lib/labels";
import {
  isRepositoryError,
  type RepositoryError,
} from "@/features/issues/lib/repository-errors";
import { SupabaseIssuesRepository } from "@/features/issues/repositories/supabase-issues-repository";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableInsert, TableRow, TableUpdate } from "@/lib/supabase/types";

type IssuesRow = TableRow<"issues">;
type LabelsRow = TableRow<"labels">;
type IssueLabelsRow = TableRow<"issue_labels">;
type ActivityLogRow = TableRow<"activity_logs">;
type CommentsRow = TableRow<"comments">;

function createPostgrestError(message: string) {
  return {
    code: "42501",
    details: null,
    hint: null,
    message,
  };
}

function createSeedIssue(overrides: Partial<IssuesRow> = {}): IssuesRow {
  return {
    id: "issue-1",
    project_id: "project-1",
    issue_number: 1,
    identifier: "WEB-1",
    title: "Initial title",
    status: "Triage",
    priority: "No Priority",
    assignee_id: null,
    description: "",
    due_date: null,
    created_by: "user-1",
    updated_by: "user-1",
    created_at: "2026-03-20T00:00:00.000Z",
    updated_at: "2026-03-20T00:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

function createFakeIssuesClient(options?: {
  issueRows?: IssuesRow[];
  labelRows?: LabelsRow[];
  issueLabelRows?: IssueLabelsRow[];
  commentsRows?: CommentsRow[];
  failOnTable?:
    | "issues"
    | "labels"
    | "issue_labels"
    | "activity_logs"
    | "comments";
  failMessage?: string;
}) {
  const issueRows = [...(options?.issueRows ?? [createSeedIssue()])];
  const labelRows = [...(options?.labelRows ?? [])];
  const issueLabelRows = [...(options?.issueLabelRows ?? [])];
  const activityRows: ActivityLogRow[] = [];
  const commentRows = [...(options?.commentsRows ?? [])];

  const maybeError = (table: string) => {
    if (options?.failOnTable === table) {
      return createPostgrestError(
        options.failMessage ?? "permission denied for table"
      );
    }

    return null;
  };

  const filterRows = <T extends Record<string, unknown>>(
    rows: T[],
    filters: Array<{ column: string; value: unknown; type: "eq" | "in" }>
  ) =>
    rows.filter((row) =>
      filters.every((filter) => {
        const rowValue = row[filter.column];
        if (filter.type === "eq") {
          return rowValue === filter.value;
        }

        return Array.isArray(filter.value) && filter.value.includes(rowValue);
      })
    );

  function createSelectBuilder<T extends Record<string, unknown>>(config: {
    rows: T[];
    table: string;
    orderBy?: { column: string; ascending: boolean } | null;
  }) {
    const filters: Array<{
      column: string;
      value: unknown;
      type: "eq" | "in";
    }> = [];
    let orderBy = config.orderBy ?? null;

    const resolve = () => {
      const error = maybeError(config.table);
      if (error) {
        return { data: null, error };
      }

      const rows = filterRows(config.rows, filters);
      let sortedRows = rows;

      if (orderBy) {
        const activeOrderBy = orderBy;
        sortedRows = [...rows].sort((left, right) => {
          const leftValue = left[activeOrderBy.column];
          const rightValue = right[activeOrderBy.column];
          if (leftValue === rightValue) {
            return 0;
          }
          if (leftValue == null) {
            return 1;
          }
          if (rightValue == null) {
            return -1;
          }
          const result = leftValue < rightValue ? -1 : 1;
          return activeOrderBy.ascending ? result : -result;
        });
      }

      return { data: sortedRows, error: null };
    };

    const builder = {
      eq(column: string, value: unknown) {
        filters.push({ column, value, type: "eq" });
        return builder;
      },
      in(column: string, value: unknown[]) {
        filters.push({ column, value, type: "in" });
        return builder;
      },
      order(column: string, options?: { ascending?: boolean }) {
        orderBy = { column, ascending: options?.ascending ?? true };
        return builder;
      },
      async maybeSingle() {
        const result = resolve();
        if (result.error) {
          return result;
        }

        return {
          data: result.data[0] ?? null,
          error: null,
        };
      },
      async single() {
        const result = resolve();
        if (result.error) {
          return result;
        }

        return {
          data: result.data[0] ?? null,
          error: null,
        };
      },
      // biome-ignore lint/suspicious/noThenProperty: test builder intentionally mimics Supabase thenables
      then(
        onFulfilled: (value: { data: T[] | null; error: unknown }) => unknown
      ) {
        return Promise.resolve(resolve()).then(onFulfilled);
      },
    };

    return builder;
  }

  const client = {
    from(table: string) {
      if (table === "issues") {
        return {
          select() {
            return createSelectBuilder({
              rows: issueRows,
              table: "issues",
            });
          },
          insert(payload: TableInsert<"issues">) {
            const insertedRow: IssuesRow = {
              id: `issue-${issueRows.length + 1}`,
              issue_number: issueRows.length + 1,
              identifier: `WEB-${issueRows.length + 1}`,
              created_at: "2026-03-21T00:00:00.000Z",
              updated_at: "2026-03-21T00:00:00.000Z",
              version: 1,
              assignee_id: payload.assignee_id ?? null,
              description: payload.description ?? "",
              due_date: payload.due_date ?? null,
              priority: payload.priority ?? "No Priority",
              status: payload.status ?? "Triage",
              ...payload,
            };

            return {
              select() {
                return {
                  async single() {
                    const error = maybeError("issues");
                    if (error) {
                      return { data: null, error };
                    }

                    issueRows.push(insertedRow);
                    return { data: insertedRow, error: null };
                  },
                };
              },
            };
          },
          update(patch: TableUpdate<"issues">) {
            return {
              eq(column: string, value: unknown) {
                if (column !== "id") {
                  return this;
                }

                return {
                  eq(versionColumn: string, versionValue: unknown) {
                    return {
                      select() {
                        return {
                          async maybeSingle() {
                            const error = maybeError("issues");
                            if (error) {
                              return { data: null, error };
                            }

                            const row = issueRows.find(
                              (issue) => issue.id === value
                            );
                            if (
                              !row ||
                              versionColumn !== "version" ||
                              row.version !== versionValue
                            ) {
                              return { data: null, error: null };
                            }

                            Object.assign(row, patch);
                            return { data: row, error: null };
                          },
                        };
                      },
                    };
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
            return createSelectBuilder({
              rows: labelRows,
              table: "labels",
            });
          },
          insert(payload: TableInsert<"labels">[]) {
            return {
              // biome-ignore lint/suspicious/noThenProperty: test builder intentionally mimics Supabase thenables
              async then(
                onFulfilled: (value: { error: unknown; data: null }) => unknown
              ) {
                const error = maybeError("labels");
                if (!error) {
                  for (const row of payload) {
                    labelRows.push({
                      id: `label-${labelRows.length + 1}`,
                      created_at: "2026-03-21T00:00:00.000Z",
                      color: row.color ?? "#94A3B8",
                      ...row,
                    });
                  }
                }

                return Promise.resolve({
                  data: null,
                  error,
                }).then(onFulfilled);
              },
            };
          },
        };
      }

      if (table === "issue_labels") {
        return {
          select() {
            return createSelectBuilder({
              rows: issueLabelRows,
              table: "issue_labels",
            });
          },
          insert(payload: TableInsert<"issue_labels">[]) {
            return {
              // biome-ignore lint/suspicious/noThenProperty: test builder intentionally mimics Supabase thenables
              async then(
                onFulfilled: (value: { error: unknown; data: null }) => unknown
              ) {
                const error = maybeError("issue_labels");
                if (!error) {
                  for (const row of payload) {
                    issueLabelRows.push({
                      created_at: "2026-03-21T00:00:00.000Z",
                      ...row,
                    });
                  }
                }

                return Promise.resolve({
                  data: null,
                  error,
                }).then(onFulfilled);
              },
            };
          },
        };
      }

      if (table === "activity_logs") {
        return {
          select() {
            return createSelectBuilder({
              rows: activityRows,
              table: "activity_logs",
            });
          },
          insert(row: Omit<ActivityLogRow, "id" | "created_at">) {
            const insertedRow: ActivityLogRow = {
              id: `activity-${activityRows.length + 1}`,
              created_at: "2026-03-21T00:00:00.000Z",
              ...row,
            };

            return {
              select() {
                return {
                  async single() {
                    const error = maybeError("activity_logs");
                    if (error) {
                      return { data: null, error };
                    }

                    activityRows.push(insertedRow);
                    return { data: insertedRow, error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "comments") {
        return {
          select() {
            return createSelectBuilder({
              rows: commentRows,
              table: "comments",
            });
          },
          insert(row: TableInsert<"comments">) {
            const insertedRow: CommentsRow = {
              id: `comment-${commentRows.length + 1}`,
              created_at: "2026-03-21T00:00:00.000Z",
              ...row,
            };

            return {
              select() {
                return {
                  async single() {
                    const error = maybeError("comments");
                    if (error) {
                      return { data: null, error };
                    }

                    commentRows.push(insertedRow);
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
    issueLabelRows,
    issueRows,
    labelRows,
  };
}

describe("SupabaseIssuesRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates missing labels and links them when creating an issue", async () => {
    const fake = createFakeIssuesClient({
      issueRows: [],
      labelRows: [
        {
          id: "label-existing",
          project_id: "project-1",
          name: "Backend",
          name_key: createLabelKey("Backend"),
          color: "#16A34A",
          created_by: "user-1",
          created_at: "2026-03-20T00:00:00.000Z",
        },
      ],
    });
    const repository = new SupabaseIssuesRepository(fake.client);

    const issue = await repository.createIssue({
      createdBy: "user-1",
      labels: ["Backend", "Auth"],
      projectId: "project-1",
      title: "Create label wiring",
    });

    expect(issue.identifier).toBe("WEB-1");
    expect(issue.labels.map((label) => label.name)).toEqual([
      "Backend",
      "Auth",
    ]);
    expect(fake.labelRows).toHaveLength(2);
    expect(fake.issueLabelRows).toHaveLength(2);
    expect(githubSyncMocks.syncIssueToGitHub).toHaveBeenCalledTimes(1);
  });

  it("returns project issues with their labels attached", async () => {
    const fake = createFakeIssuesClient({
      issueRows: [
        createSeedIssue(),
        createSeedIssue({
          id: "issue-2",
          issue_number: 2,
          identifier: "WEB-2",
          title: "Second issue",
        }),
      ],
      labelRows: [
        {
          id: "label-1",
          project_id: "project-1",
          name: "Auth",
          name_key: createLabelKey("Auth"),
          color: "#5E6AD2",
          created_by: "user-1",
          created_at: "2026-03-20T00:00:00.000Z",
        },
      ],
      issueLabelRows: [
        {
          created_at: "2026-03-20T00:00:00.000Z",
          issue_id: "issue-2",
          label_id: "label-1",
          project_id: "project-1",
        },
      ],
    });
    const repository = new SupabaseIssuesRepository(fake.client);

    const issues = await repository.listIssuesByProject("project-1");

    expect(issues).toHaveLength(2);
    expect(issues[0]?.labels).toEqual([]);
    expect(issues[1]?.labels.map((label) => label.name)).toEqual(["Auth"]);
  });

  it("increments version when the optimistic lock matches", async () => {
    const fake = createFakeIssuesClient();
    const repository = new SupabaseIssuesRepository(fake.client);

    const result = await repository.updateIssue("issue-1", {
      title: "Updated title",
      updatedBy: "user-2",
      version: 1,
    });

    expect(result.version).toBe(2);
    expect(result.title).toBe("Updated title");
    expect(result.updatedBy).toBe("user-2");
    expect(fake.issueRows[0]?.version).toBe(2);
    expect(fake.activityRows).toHaveLength(1);
    expect(githubSyncMocks.updateGitHubIssue).not.toHaveBeenCalled();
  });

  it("updates linked GitHub issue on issue update", async () => {
    const fake = createFakeIssuesClient({
      issueRows: [
        createSeedIssue({
          github_issue_id: 1024,
          github_issue_number: 77,
          github_sync_status: "synced",
          github_synced_at: "2026-03-26T00:00:00.000Z",
        }),
      ],
    });
    const repository = new SupabaseIssuesRepository(fake.client);

    await repository.updateIssue("issue-1", {
      title: "Synced title",
      updatedBy: "user-2",
      version: 1,
    });

    expect(githubSyncMocks.updateGitHubIssue).toHaveBeenCalledTimes(1);
    expect(githubSyncMocks.updateGitHubIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        issueId: "issue-1",
        githubIssueId: 1024,
        githubIssueNumber: 77,
        title: "Synced title",
      })
    );
  });

  it("throws a conflict error when another update already advanced the version", async () => {
    const fake = createFakeIssuesClient();
    const repository = new SupabaseIssuesRepository(fake.client);

    const aliceRead = await repository.getIssueById("issue-1");
    const bobRead = await repository.getIssueById("issue-1");

    expect(aliceRead).not.toBeNull();
    expect(bobRead).not.toBeNull();
    if (!aliceRead || !bobRead) {
      throw new Error("Expected issue snapshots for conflict test");
    }

    await repository.updateIssue("issue-1", {
      title: "Alice title",
      updatedBy: "user-1",
      version: aliceRead.version,
    });

    await expect(
      repository.updateIssue("issue-1", {
        title: "Bob title",
        updatedBy: "user-2",
        version: bobRead.version,
      })
    ).rejects.toMatchObject({
      currentVersion: 2,
      requestedVersion: 1,
      type: "CONFLICT",
    });
  });

  it("throws a typed repository error when a Supabase query is forbidden", async () => {
    const fake = createFakeIssuesClient({
      failOnTable: "issues",
      failMessage: "new row violates row-level security policy",
    });
    const repository = new SupabaseIssuesRepository(fake.client);

    let error: unknown;
    try {
      await repository.listIssuesByProject("project-1");
    } catch (caught) {
      error = caught;
    }

    expect(isRepositoryError(error)).toBe(true);
    expect((error as RepositoryError).code).toBe("FORBIDDEN");
    expect((error as Error).message).toContain(
      "Failed to list issues by project: new row violates row-level security policy"
    );
  });
});
