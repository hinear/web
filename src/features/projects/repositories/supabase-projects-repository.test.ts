import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isRepositoryError } from "@/features/issues/lib/repository-errors";
import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableInsert, TableRow } from "@/lib/supabase/types";

type ProjectRow = TableRow<"projects">;
type ProjectMemberRow = TableRow<"project_members">;
type InvitationRow = TableRow<"project_invitations">;
type ProfileRow = TableRow<"profiles">;

function createPostgrestError(
  message: string,
  options?: { code?: string; details?: string | null }
) {
  return {
    code: options?.code ?? "42501",
    details: options?.details ?? null,
    hint: null,
    message,
  };
}

function createFakeProjectsClient(options?: {
  projectRows?: ProjectRow[];
  memberRows?: ProjectMemberRow[];
  invitationRows?: InvitationRow[];
  profileRows?: ProfileRow[];
  failOnTable?:
    | "projects"
    | "project_members"
    | "project_invitations"
    | "profiles";
  failMessage?: string;
  failCode?: string;
  failDetails?: string | null;
}) {
  const projectRows = [...(options?.projectRows ?? [])];
  const memberRows = [...(options?.memberRows ?? [])];
  const invitationRows = [...(options?.invitationRows ?? [])];
  const profileRows = [...(options?.profileRows ?? [])];

  const maybeError = (table: string) => {
    if (options?.failOnTable === table) {
      return createPostgrestError(
        options.failMessage ?? "permission denied for table",
        {
          code: options.failCode,
          details: options.failDetails,
        }
      );
    }

    return null;
  };

  function createSelectBuilder<T extends Record<string, unknown>>(config: {
    rows: T[];
    table: string;
  }) {
    const filters: Array<{ column: string; value: unknown }> = [];

    const builder = {
      eq(column: string, value: unknown) {
        filters.push({ column, value });
        return builder;
      },
      in(column: string, values: unknown[]) {
        filters.push({ column, value: values });
        return builder;
      },
      // biome-ignore lint/suspicious/noThenProperty: test builder intentionally mimics Supabase thenables
      async then<TResult1 = unknown, TResult2 = never>(
        onfulfilled?:
          | ((value: {
              data: T[] | null;
              error: ReturnType<typeof maybeError>;
            }) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null
      ) {
        const error = maybeError(config.table);
        if (error) {
          return Promise.resolve({ data: null, error }).then(
            onfulfilled,
            onrejected
          );
        }

        const rows = filters.length
          ? config.rows.filter((candidate) =>
              filters.every((filter) =>
                Array.isArray(filter.value)
                  ? filter.value.includes(candidate[filter.column])
                  : candidate[filter.column] === filter.value
              )
            )
          : config.rows;

        return Promise.resolve({ data: rows, error: null }).then(
          onfulfilled,
          onrejected
        );
      },
      async maybeSingle() {
        const error = maybeError(config.table);
        if (error) {
          return { data: null, error };
        }

        const row = filters.length
          ? (config.rows.find((candidate) =>
              filters.every((filter) =>
                Array.isArray(filter.value)
                  ? filter.value.includes(candidate[filter.column])
                  : candidate[filter.column] === filter.value
              )
            ) ?? null)
          : (config.rows[0] ?? null);

        return { data: row, error: null };
      },
      async single() {
        return builder.maybeSingle();
      },
    };

    return builder;
  }

  const client = {
    async rpc(fn: string, args: Record<string, unknown>) {
      if (fn === "create_project_with_owner") {
        const error = maybeError("projects");
        if (error) {
          return { data: null, error };
        }

        const insertedProject: ProjectRow = {
          id: `project-${projectRows.length + 1}`,
          key: String(args.project_key),
          name: String(args.project_name),
          type: args.project_type as ProjectRow["type"],
          issue_seq: 0,
          created_by: "user-1",
          created_at: "2026-03-21T00:00:00.000Z",
          updated_at: "2026-03-21T00:00:00.000Z",
        };

        projectRows.push(insertedProject);
        memberRows.push({
          created_at: "2026-03-21T00:00:00.000Z",
          project_id: insertedProject.id,
          role: "owner",
          user_id: insertedProject.created_by,
        });

        return { data: insertedProject, error: null };
      }

      if (fn === "get_invitation_by_token") {
        const token = String(args.p_token);
        const invitation =
          invitationRows.find((row) => row.token === token) ?? null;

        return {
          data: invitation ? [invitation] : [],
          error: maybeError("project_invitations"),
        };
      }

      if (fn === "accept_invitation_by_token") {
        const token = String(args.p_token);
        const userId = String(args.p_user_id);
        const invitation =
          invitationRows.find((row) => row.token === token) ?? null;

        if (!invitation) {
          return {
            data: { error: "Invitation not found" },
            error: maybeError("project_invitations"),
          };
        }

        invitation.status = "accepted";
        invitation.accepted_by = userId;
        invitation.updated_at ??= invitation.created_at;

        return {
          data: {
            id: invitation.id,
            project_id: invitation.project_id,
            status: invitation.status,
          },
          error: maybeError("project_invitations"),
        };
      }

      throw new Error(`Unexpected rpc: ${fn}`);
    },
    from(table: string) {
      if (table === "projects") {
        return {
          select() {
            return createSelectBuilder({
              rows: projectRows,
              table: "projects",
            });
          },
          update(payload: Partial<TableInsert<"projects">>) {
            let targetId: string | null = null;

            return {
              eq(column: string, value: unknown) {
                if (column === "id") {
                  targetId = String(value);
                }

                return {
                  select() {
                    return {
                      async single() {
                        const error = maybeError("projects");
                        if (error) {
                          return { data: null, error };
                        }

                        const index = projectRows.findIndex(
                          (row) => row.id === targetId
                        );

                        if (index === -1) {
                          return { data: null, error: null };
                        }

                        const updatedRow = {
                          ...projectRows[index],
                          ...payload,
                        } as ProjectRow;

                        projectRows[index] = updatedRow;

                        return { data: updatedRow, error: null };
                      },
                    };
                  },
                };
              },
            };
          },
          insert(payload: TableInsert<"projects">) {
            const insertedRow: ProjectRow = {
              id: `project-${projectRows.length + 1}`,
              issue_seq: 0,
              created_at: "2026-03-21T00:00:00.000Z",
              updated_at: "2026-03-21T00:00:00.000Z",
              ...payload,
            };

            return {
              select() {
                return {
                  async single() {
                    const error = maybeError("projects");
                    if (error) {
                      return { data: null, error };
                    }

                    projectRows.push(insertedRow);
                    return { data: insertedRow, error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "project_members") {
        return {
          select() {
            return createSelectBuilder({
              rows: memberRows,
              table: "project_members",
            });
          },
          insert(payload: TableInsert<"project_members">) {
            const insertedRow: ProjectMemberRow = {
              created_at: "2026-03-21T00:00:00.000Z",
              ...payload,
            };

            return {
              select() {
                return {
                  async single() {
                    const error = maybeError("project_members");
                    if (error) {
                      return { data: null, error };
                    }

                    memberRows.push(insertedRow);
                    return { data: insertedRow, error: null };
                  },
                };
              },
            };
          },
          delete() {
            const filters: Array<{ column: string; value: unknown }> = [];

            const builder = {
              eq(column: string, value: unknown) {
                filters.push({ column, value });
                return builder;
              },
              // biome-ignore lint/suspicious/noThenProperty: test builder intentionally mimics Supabase thenables
              async then<TResult1 = unknown, TResult2 = never>(
                onfulfilled?:
                  | ((value: {
                      data: null;
                      error: ReturnType<typeof maybeError>;
                    }) => TResult1 | PromiseLike<TResult1>)
                  | null,
                onrejected?:
                  | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
                  | null
              ) {
                const error = maybeError("project_members");
                if (error) {
                  return Promise.resolve({ data: null, error }).then(
                    onfulfilled,
                    onrejected
                  );
                }

                for (
                  let index = memberRows.length - 1;
                  index >= 0;
                  index -= 1
                ) {
                  const candidate = memberRows[index];
                  const matches = filters.every(
                    (filter) =>
                      (candidate as Record<string, unknown>)[filter.column] ===
                      filter.value
                  );

                  if (matches) {
                    memberRows.splice(index, 1);
                  }
                }

                return Promise.resolve({ data: null, error: null }).then(
                  onfulfilled,
                  onrejected
                );
              },
            };

            return builder;
          },
        };
      }

      if (table === "project_invitations") {
        return {
          select() {
            return createSelectBuilder({
              rows: invitationRows,
              table: "project_invitations",
            });
          },
          update(payload: Partial<TableInsert<"project_invitations">>) {
            let targetId: string | null = null;

            return {
              eq(column: string, value: unknown) {
                if (column === "id") {
                  targetId = String(value);
                }

                return {
                  select() {
                    return {
                      async single() {
                        const error = maybeError("project_invitations");
                        if (error) {
                          return { data: null, error };
                        }

                        const index = invitationRows.findIndex(
                          (row) => row.id === targetId
                        );

                        if (index === -1) {
                          return { data: null, error: null };
                        }

                        const updatedRow = {
                          ...invitationRows[index],
                          ...payload,
                        } as InvitationRow;

                        invitationRows[index] = updatedRow;

                        return { data: updatedRow, error: null };
                      },
                    };
                  },
                };
              },
            };
          },
          insert(payload: TableInsert<"project_invitations">) {
            const insertedRow: InvitationRow = {
              id: `invitation-${invitationRows.length + 1}`,
              accepted_by: null,
              created_at: "2026-03-21T00:00:00.000Z",
              role: "member",
              status: "pending",
              updated_at: "2026-03-21T00:00:00.000Z",
              ...payload,
            };

            return {
              select() {
                return {
                  async single() {
                    const error = maybeError("project_invitations");
                    if (error) {
                      return { data: null, error };
                    }

                    invitationRows.push(insertedRow);
                    return { data: insertedRow, error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "profiles") {
        return {
          select() {
            return createSelectBuilder({
              rows: profileRows,
              table: "profiles",
            });
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return {
    client: client as unknown as AppSupabaseServerClient,
    invitationRows,
    memberRows,
    profileRows,
    projectRows,
  };
}

describe("SupabaseProjectsRepository", () => {
  it("creates and loads projects through the repository contract", async () => {
    const fake = createFakeProjectsClient();
    const repository = new SupabaseProjectsRepository(fake.client);

    const project = await repository.createProject({
      createdBy: "user-1",
      key: "WEB",
      name: "Web Platform",
      type: "team",
    });

    expect(project.id).toBe("project-1");
    expect(project.issueSeq).toBe(0);

    const loadedProject = await repository.getProjectById(project.id);
    expect(loadedProject).toEqual(project);
  });

  it("updates project metadata through the repository contract", async () => {
    const fake = createFakeProjectsClient({
      projectRows: [
        {
          id: "project-1",
          key: "WEB",
          name: "Web Platform",
          type: "team",
          issue_seq: 0,
          created_by: "user-1",
          created_at: "2026-03-19T00:00:00.000Z",
          updated_at: "2026-03-19T00:00:00.000Z",
        },
      ],
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    const project = await repository.updateProject({
      key: "OPS",
      name: "Ops Workspace",
      projectId: "project-1",
      type: "personal",
    });

    expect(project).toMatchObject({
      id: "project-1",
      key: "OPS",
      name: "Ops Workspace",
      type: "personal",
    });
  });

  it("adds members and invitations through the same fake client state", async () => {
    const fake = createFakeProjectsClient();
    const repository = new SupabaseProjectsRepository(fake.client);

    const member = await repository.addProjectMember({
      createdAt: "2026-03-21T00:00:00.000Z",
      projectId: "project-1",
      role: "owner",
      userId: "user-1",
    });
    const invitation = await repository.inviteProjectMember({
      email: "Teammate@Example.com",
      invitedBy: "user-1",
      projectId: "project-1",
    });

    expect(member.role).toBe("owner");
    expect(invitation.email).toBe("teammate@example.com");
    expect(fake.memberRows).toHaveLength(1);
    expect(fake.invitationRows).toHaveLength(1);
  });

  it("lists project members and pending invitations for workspace read models", async () => {
    const fake = createFakeProjectsClient({
      invitationRows: [
        {
          accepted_by: null,
          created_at: "2026-03-21T00:00:00.000Z",
          email: "pending@example.com",
          expires_at: "2026-03-28T00:00:00.000Z",
          id: "invitation-1",
          invited_by: "user-1",
          project_id: "project-1",
          role: "member",
          status: "pending",
          token: "token-1",
          updated_at: "2026-03-21T00:00:00.000Z",
        },
      ],
      memberRows: [
        {
          created_at: "2026-03-21T00:00:00.000Z",
          project_id: "project-1",
          role: "owner",
          user_id: "user-1",
        },
        {
          created_at: "2026-03-22T00:00:00.000Z",
          project_id: "project-1",
          role: "member",
          user_id: "user-2",
        },
      ],
      profileRows: [
        {
          avatar_url: "https://example.com/alex.png",
          created_at: "2026-03-20T00:00:00.000Z",
          display_name: "Alex Kim",
          email: "alex@example.com",
          email_normalized: "alex@example.com",
          id: "user-1",
          updated_at: "2026-03-20T00:00:00.000Z",
        },
      ],
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    const members = await repository.listProjectMembers("project-1");
    const invitations =
      await repository.listPendingProjectInvitations("project-1");

    expect(members).toHaveLength(2);
    expect(members[0]).toMatchObject({
      id: "user-1",
      name: "Alex Kim",
      role: "owner",
    });
    expect(invitations).toEqual([
      expect.objectContaining({
        email: "pending@example.com",
        invitedBy: "Alex Kim",
        invitedByAvatarUrl: "https://example.com/alex.png",
        status: "pending",
        token: "token-1",
      }),
    ]);
  });

  it("throws a typed repository error when project queries are forbidden", async () => {
    const fake = createFakeProjectsClient({
      failOnTable: "projects",
      failMessage: "permission denied for table projects",
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    await expect(
      repository.createProject({
        createdBy: "user-1",
        key: "WEB",
        name: "Web Platform",
        type: "team",
      })
    ).rejects.toSatisfy((error: unknown) => {
      return (
        isRepositoryError(error) &&
        error.code === "FORBIDDEN" &&
        error.message.includes(
          "Failed to create project: permission denied for table projects"
        )
      );
    });
  });

  it("maps duplicate project keys to a conflict repository error", async () => {
    const fake = createFakeProjectsClient({
      failOnTable: "projects",
      failCode: "23505",
      failDetails:
        'Key (key)=(WEB) already exists. constraint "projects_key_key"',
      failMessage:
        'duplicate key value violates unique constraint "projects_key_key"',
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    await expect(
      repository.createProject({
        createdBy: "user-1",
        key: "WEB",
        name: "Web Platform",
        type: "team",
      })
    ).rejects.toSatisfy((error: unknown) => {
      return (
        isRepositoryError(error) &&
        error.code === "PROJECT_KEY_TAKEN" &&
        error.status === 409 &&
        error.message === "Project key already exists."
      );
    });
  });

  it("maps duplicate pending invitations to a conflict repository error", async () => {
    const fake = createFakeProjectsClient({
      failOnTable: "project_invitations",
      failCode: "23505",
      failDetails:
        'Key (project_id, lower(email::text))=(project-1, teammate@example.com) already exists. constraint "project_invitations_pending_email_idx"',
      failMessage:
        'duplicate key value violates unique constraint "project_invitations_pending_email_idx"',
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    await expect(
      repository.inviteProjectMember({
        email: "teammate@example.com",
        invitedBy: "user-1",
        projectId: "project-1",
      })
    ).rejects.toSatisfy((error: unknown) => {
      return (
        isRepositoryError(error) &&
        error.code === "PROJECT_INVITATION_EXISTS" &&
        error.status === 409 &&
        error.message === "A pending invitation already exists for this email."
      );
    });
  });

  it("resends and revokes invitations through the repository contract", async () => {
    const fake = createFakeProjectsClient({
      invitationRows: [
        {
          accepted_by: null,
          created_at: "2026-03-21T00:00:00.000Z",
          email: "pending@example.com",
          expires_at: "2026-03-28T00:00:00.000Z",
          id: "invitation-1",
          invited_by: "user-1",
          project_id: "project-1",
          role: "member",
          status: "pending",
          token: "token-1",
          updated_at: "2026-03-21T00:00:00.000Z",
        },
      ],
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    const resent = await repository.resendProjectInvitation("invitation-1");
    const revoked = await repository.revokeProjectInvitation("invitation-1");

    expect(resent.id).toBe("invitation-1");
    expect(resent.token).not.toBe("token-1");
    expect(revoked.status).toBe("revoked");
  });

  it("loads an invitation by token from a table-returning RPC response", async () => {
    const fake = createFakeProjectsClient({
      invitationRows: [
        {
          accepted_by: null,
          created_at: "2026-03-21T00:00:00.000Z",
          email: "pending@example.com",
          expires_at: "2026-03-28T00:00:00.000Z",
          id: "invitation-1",
          invited_by: "user-1",
          project_id: "project-1",
          role: "member",
          status: "pending",
          token: "token-1",
          updated_at: "2026-03-21T00:00:00.000Z",
        },
      ],
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    const invitation = await repository.getProjectInvitationByToken("token-1");

    expect(invitation).toMatchObject({
      id: "invitation-1",
      email: "pending@example.com",
      projectId: "project-1",
      status: "pending",
      token: "token-1",
    });
  });

  it("accepts an invitation via JSON RPC result and reloads the invitation", async () => {
    const fake = createFakeProjectsClient({
      invitationRows: [
        {
          accepted_by: null,
          created_at: "2026-03-21T00:00:00.000Z",
          email: "pending@example.com",
          expires_at: "2026-03-28T00:00:00.000Z",
          id: "invitation-1",
          invited_by: "user-1",
          project_id: "project-1",
          role: "member",
          status: "pending",
          token: "token-1",
          updated_at: "2026-03-21T00:00:00.000Z",
        },
      ],
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    const invitation = await repository.acceptProjectInvitation(
      "token-1",
      "user-2"
    );

    expect(invitation.status).toBe("accepted");
    expect(invitation.acceptedBy).toBe("user-2");
  });

  it("removes a project member through the repository contract", async () => {
    const fake = createFakeProjectsClient({
      memberRows: [
        {
          created_at: "2026-03-21T00:00:00.000Z",
          project_id: "project-1",
          role: "owner",
          user_id: "user-1",
        },
        {
          created_at: "2026-03-22T00:00:00.000Z",
          project_id: "project-1",
          role: "member",
          user_id: "user-2",
        },
      ],
    });
    const repository = new SupabaseProjectsRepository(fake.client);

    await repository.removeProjectMember("project-1", "user-2");

    expect(fake.memberRows).toEqual([
      expect.objectContaining({
        project_id: "project-1",
        user_id: "user-1",
      }),
    ]);
  });
});
