import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type {
  CreateProjectInput,
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
  };
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
  };
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
    .select()
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
    const { data, error } = await this.client
      .from("projects")
      .select()
      .eq("id", projectId)
      .maybeSingle();

    assertQuerySucceeded("Failed to load project", error);

    return data ? mapProject(data) : null;
  }

  async listProjectMembers(projectId: string): Promise<ProjectMemberSummary[]> {
    const { data, error } = await this.client
      .from("project_members")
      .select()
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
      .select()
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
    const { data, error } = await this.client
      .from("project_invitations")
      .select()
      .eq("token", token)
      .maybeSingle();

    assertQuerySucceeded("Failed to load project invitation", error);

    return data ? mapProjectInvitation(data) : null;
  }

  async acceptProjectInvitation(
    token: string,
    actorId: string
  ): Promise<ProjectInvitation> {
    const invitation = await this.getProjectInvitationByToken(token);

    if (!invitation) {
      throw createRepositoryError("UNKNOWN", "Invitation not found.");
    }

    if (invitation.status !== "pending") {
      return invitation;
    }

    if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
      const { data, error } = await this.client
        .from("project_invitations")
        .update({
          status: "expired",
        })
        .eq("id", invitation.id)
        .select()
        .single();

      assertQuerySucceeded("Failed to expire project invitation", error);

      return mapProjectInvitation(
        assertDataPresent("Failed to expire project invitation", data)
      );
    }

    const { error: memberError } = await this.client
      .from("project_members")
      .insert({
        project_id: invitation.projectId,
        role: "member",
        user_id: actorId,
      });

    if (memberError && memberError.code !== "23505") {
      assertQuerySucceeded("Failed to add invited project member", memberError);
    }

    const { data, error } = await this.client
      .from("project_invitations")
      .update({
        accepted_by: actorId,
        status: "accepted",
      })
      .eq("id", invitation.id)
      .select()
      .single();

    assertQuerySucceeded("Failed to accept project invitation", error);

    return mapProjectInvitation(
      assertDataPresent("Failed to accept project invitation", data)
    );
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
}
