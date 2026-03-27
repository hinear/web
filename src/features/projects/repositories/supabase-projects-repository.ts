import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type {
  CreateProjectInput,
  DeleteProjectInput,
  InviteProjectMemberInput,
  ProjectsRepository,
  UpdateProjectInput,
} from "@/features/projects/contracts";
import type {
  Project,
  ProjectInvitation,
  ProjectInvitationSummary,
  ProjectMember,
  ProjectMemberSummary,
} from "@/features/projects/types";
import { trackQuery } from "@/lib/performance/query-tracker";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableInsert, TableRow } from "@/lib/supabase/types";

function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw createPostgrestRepositoryError(context, error);
  }
}

function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw createRepositoryError(
      "UNKNOWN",
      `${context}: query returned no rows.`
    );
  }

  return data;
}

function mapProject(row: TableRow<"projects">): Project {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    type: row.type,
    issueSeq: row.issue_seq,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    githubRepoOwner: row.github_repo_owner,
    githubRepoName: row.github_repo_name,
    githubIntegrationEnabled: row.github_integration_enabled ?? false,
  };
}

function isProjectRow(value: unknown): value is TableRow<"projects"> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "key" in value &&
      "name" in value &&
      "type" in value
  );
}

function mapProjectMember(row: TableRow<"project_members">): ProjectMember {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

function mapProjectInvitation(
  row: TableRow<"project_invitations">
): ProjectInvitation {
  return {
    id: row.id,
    projectId: row.project_id,
    email: row.email,
    role: "member",
    invitedBy: row.invited_by,
    status: row.status,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedBy: row.accepted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ProjectInvitationRpcRow = {
  accepted_by: string | null;
  created_at: string;
  email: string;
  expires_at: string;
  id: string;
  invited_by: string;
  project_id: string;
  role: "member";
  status: ProjectInvitation["status"];
  token: string;
  updated_at?: string | null;
};

function isProjectInvitationRpcRow(
  value: unknown
): value is ProjectInvitationRpcRow {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "project_id" in value &&
      "email" in value &&
      "token" in value
  );
}

type AcceptProjectInvitationRpcResult = {
  already_accepted?: boolean;
  error?: string;
  id: string;
  project_id: string;
  status: ProjectInvitation["status"];
};

function isAcceptProjectInvitationRpcResult(
  value: unknown
): value is AcceptProjectInvitationRpcResult {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "project_id" in value &&
      "status" in value
  );
}

function getRpcSingleRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }

  return (value as T | null) ?? null;
}

function createInvitationDraft(
  input: InviteProjectMemberInput
): TableInsert<"project_invitations"> {
  return {
    project_id: input.projectId,
    email: input.email.trim().toLowerCase(),
    invited_by: input.invitedBy,
    role: "member",
    status: "pending",
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function formatRelativeProjectDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getProfileDisplayName(
  profile: TableRow<"profiles"> | undefined
): string | null {
  const value = profile?.display_name?.trim();
  return value && value.length > 0 ? value : null;
}

async function listProfilesByIds(
  client: AppSupabaseServerClient,
  ids: string[]
): Promise<Map<string, TableRow<"profiles">>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .in("id", uniqueIds);

  assertQuerySucceeded("Failed to load profiles", error);

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export class SupabaseProjectsRepository implements ProjectsRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async createProject(input: CreateProjectInput): Promise<Project> {
    const { data, error } = await this.client.rpc("create_project_with_owner", {
      project_key: input.key,
      project_name: input.name,
      project_type: input.type,
    });

    assertQuerySucceeded("Failed to create project", error);

    return mapProject(assertDataPresent("Failed to create project", data));
  }

  async updateProject(input: UpdateProjectInput): Promise<Project> {
    const { data, error } = await this.client
      .from("projects")
      .update({
        key: input.key,
        name: input.name,
        type: input.type,
      })
      .eq("id", input.projectId)
      .select()
      .single();

    assertQuerySucceeded("Failed to update project", error);

    return mapProject(assertDataPresent("Failed to update project", data));
  }

  async deleteProject(input: DeleteProjectInput): Promise<void> {
    // 먼저 프로젝트가 존재하는지 확인
    const project = await this.getProjectById(input.projectId);

    if (!project) {
      throw createRepositoryError("PROJECT_NOT_FOUND", "Project not found.");
    }

    // 프로젝트 삭제 (cascade로 관련 데이터도 함께 삭제됨)
    const { error } = await this.client
      .from("projects")
      .delete()
      .eq("id", input.projectId);

    assertQuerySucceeded("Failed to delete project", error);
  }

  async addProjectMember(member: ProjectMember): Promise<ProjectMember> {
    const { data, error } = await this.client
      .from("project_members")
      .insert({
        project_id: member.projectId,
        user_id: member.userId,
        role: member.role,
        created_at: member.createdAt,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to add project member", error);

    return mapProjectMember(
      assertDataPresent("Failed to add project member", data)
    );
  }

  async inviteProjectMember(
    input: InviteProjectMemberInput
  ): Promise<ProjectInvitation> {
    const { data, error } = await this.client
      .from("project_invitations")
      .insert(createInvitationDraft(input))
      .select()
      .single();

    assertQuerySucceeded("Failed to invite project member", error);

    return mapProjectInvitation(
      assertDataPresent("Failed to invite project member", data)
    );
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return trackQuery("getProjectById", async () => {
      const { data, error } = await this.client
        .from("projects")
        .select(
          "id, key, name, type, issue_seq, created_by, created_at, updated_at, github_repo_owner, github_repo_name, github_integration_enabled"
        )
        .eq("id", projectId)
        .maybeSingle();

      assertQuerySucceeded("Failed to load project", error);

      return data ? mapProject(data) : null;
    });
  }

  async listProjectMembers(projectId: string): Promise<ProjectMemberSummary[]> {
    const { data, error } = await this.client
      .from("project_members")
      .select("project_id, user_id, role, created_at")
      .eq("project_id", projectId);

    assertQuerySucceeded("Failed to load project members", error);

    const rows = data ?? [];
    const profilesById = await listProfilesByIds(
      this.client,
      rows.map((row) => row.user_id)
    );

    return rows.map((row) => ({
      avatarUrl: profilesById.get(row.user_id)?.avatar_url ?? null,
      canRemove: row.role !== "owner",
      id: row.user_id,
      isCurrentUser: false,
      name: getProfileDisplayName(profilesById.get(row.user_id)) ?? row.user_id,
      note:
        row.role === "owner"
          ? `Owner since ${formatRelativeProjectDate(row.created_at)}`
          : `Joined ${formatRelativeProjectDate(row.created_at)}`,
      role: row.role,
    }));
  }

  async listPendingProjectInvitations(
    projectId: string
  ): Promise<ProjectInvitationSummary[]> {
    const { data, error } = await this.client
      .from("project_invitations")
      .select(
        "id, project_id, email, invited_by, status, token, expires_at, created_at"
      )
      .eq("project_id", projectId)
      .eq("status", "pending");

    assertQuerySucceeded("Failed to load project invitations", error);

    const rows = data ?? [];
    const profilesById = await listProfilesByIds(
      this.client,
      rows.map((row) => row.invited_by)
    );

    return rows.map((row) => ({
      createdAt: row.created_at,
      email: row.email,
      expiresAt: row.expires_at,
      id: row.id,
      token: row.token,
      invitedBy:
        getProfileDisplayName(profilesById.get(row.invited_by)) ??
        row.invited_by,
      invitedByAvatarUrl: profilesById.get(row.invited_by)?.avatar_url ?? null,
      status: row.status,
    }));
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    assertQuerySucceeded("Failed to remove project member", error);
  }

  async getProjectInvitationByToken(
    token: string
  ): Promise<ProjectInvitation | null> {
    const { data, error } = await (
      this.client.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: unknown; error: PostgrestError | null }>
    )("get_invitation_by_token", {
      p_token: token,
    });

    assertQuerySucceeded("Failed to load project invitation", error);

    const row = getRpcSingleRow<unknown>(data);

    if (!isProjectInvitationRpcRow(row)) {
      return null;
    }

    return mapProjectInvitation({
      id: row.id,
      project_id: row.project_id,
      email: row.email,
      role: row.role,
      status: row.status,
      token: row.token,
      invited_by: row.invited_by,
      expires_at: row.expires_at,
      accepted_by: row.accepted_by,
      created_at: row.created_at,
      updated_at: row.updated_at ?? row.created_at,
    });
  }

  async acceptProjectInvitation(
    token: string,
    actorId: string
  ): Promise<ProjectInvitation> {
    const { data, error } = await (
      this.client.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: unknown; error: PostgrestError | null }>
    )("accept_invitation_by_token", {
      p_token: token,
      p_user_id: actorId,
    });

    assertQuerySucceeded("Failed to accept project invitation", error);

    if (!isAcceptProjectInvitationRpcResult(data)) {
      throw createRepositoryError("UNKNOWN", "Failed to accept invitation");
    }

    // Check for error response
    if ("error" in data) {
      throw createRepositoryError("UNKNOWN", String(data.error));
    }

    // The RPC function returns {id, project_id, status}
    // We need to fetch the full invitation details
    const invitation = await this.getProjectInvitationByToken(token);

    if (!invitation) {
      throw createRepositoryError(
        "UNKNOWN",
        "Invitation not found after accept"
      );
    }

    return invitation;
  }

  async resendProjectInvitation(
    invitationId: string
  ): Promise<ProjectInvitation> {
    const { data, error } = await this.client
      .from("project_invitations")
      .update({
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        token: crypto.randomUUID(),
      })
      .eq("id", invitationId)
      .select()
      .single();

    assertQuerySucceeded("Failed to resend project invitation", error);

    return mapProjectInvitation(
      assertDataPresent("Failed to resend project invitation", data)
    );
  }

  async revokeProjectInvitation(
    invitationId: string
  ): Promise<ProjectInvitation> {
    const { data, error } = await this.client
      .from("project_invitations")
      .update({
        status: "revoked",
      })
      .eq("id", invitationId)
      .select()
      .single();

    assertQuerySucceeded("Failed to revoke project invitation", error);

    return mapProjectInvitation(
      assertDataPresent("Failed to revoke project invitation", data)
    );
  }

  // 누락됨 - 조회 메서드
  async getProjectByKey(key: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from("projects")
      .select(
        "id, key, name, type, issue_seq, created_by, created_at, updated_at, github_repo_owner, github_repo_name, github_integration_enabled"
      )
      .eq("key", key)
      .maybeSingle();

    assertQuerySucceeded("Failed to get project by key", error);

    return data ? mapProject(data) : null;
  }

  async listProjects(): Promise<Project[]> {
    const { data, error } = await this.client
      .from("projects")
      .select(
        "id, key, name, type, issue_seq, created_by, created_at, updated_at, github_repo_owner, github_repo_name, github_integration_enabled"
      )
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to list projects", error);

    return (data ?? []).map(mapProject);
  }

  async listUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from("project_members")
      .select(`
        project_id,
        projects (
          id,
          key,
          name,
          type,
          issue_seq,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId);

    assertQuerySucceeded("Failed to list user projects", error);

    const projects: Project[] = [];

    for (const row of data ?? []) {
      const project = row.projects as unknown;
      if (isProjectRow(project)) {
        projects.push(mapProject(project));
      }
    }

    return projects;
  }

  async listProjectsByType(type: Project["type"]): Promise<Project[]> {
    const { data, error } = await this.client
      .from("projects")
      .select(
        "id, key, name, type, issue_seq, created_by, created_at, updated_at, github_repo_owner, github_repo_name, github_integration_enabled"
      )
      .eq("type", type)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to list projects by type", error);

    return (data ?? []).map(mapProject);
  }

  // 누락됨 - 접근 제어 메서드
  async checkProjectAccess(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    assertQuerySucceeded("Failed to check project access", error);

    return data !== null;
  }

  async validateProjectKey(key: string): Promise<boolean> {
    // Project key should be 2-10 uppercase letters/numbers
    const keyRegex = /^[A-Z0-9]{2,10}$/;
    return keyRegex.test(key);
  }

  async projectExists(key: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("projects")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    assertQuerySucceeded("Failed to check if project exists", error);

    return data !== null;
  }
}

// Factory function
export function createProjectsRepository(
  client: AppSupabaseServerClient
): ProjectsRepository {
  return new SupabaseProjectsRepository(client);
}
