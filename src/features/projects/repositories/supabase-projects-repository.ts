import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  CreateProjectInput,
  InviteProjectMemberInput,
  ProjectsRepository,
} from "@/features/projects/contracts";
import type {
  Project,
  ProjectInvitation,
  ProjectMember,
} from "@/features/projects/types";
import {
  createServiceRoleSupabaseClient,
  type AppSupabaseServerClient,
} from "@/lib/supabase/server-client";
import type { TableInsert, TableRow } from "@/lib/supabase/types";

function assertQuerySucceeded(context: string, error: PostgrestError | null): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw new Error(`${context}: query returned no rows.`);
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

function mapProjectInvitation(row: TableRow<"project_invitations">): ProjectInvitation {
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
  input: InviteProjectMemberInput,
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

export class SupabaseProjectsRepository implements ProjectsRepository {
  constructor(
    private readonly client: AppSupabaseServerClient = createServiceRoleSupabaseClient(),
  ) {}

  async createProject(input: CreateProjectInput): Promise<Project> {
    const { data, error } = await this.client
      .from("projects")
      .insert({
        key: input.key,
        name: input.name,
        type: input.type,
        created_by: input.createdBy,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create project", error);

    return mapProject(assertDataPresent("Failed to create project", data));
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

    return mapProjectMember(assertDataPresent("Failed to add project member", data));
  }

  async inviteProjectMember(
    input: InviteProjectMemberInput,
  ): Promise<ProjectInvitation> {
    const { data, error } = await this.client
      .from("project_invitations")
      .insert(createInvitationDraft(input))
      .select()
      .single();

    assertQuerySucceeded("Failed to invite project member", error);

    return mapProjectInvitation(
      assertDataPresent("Failed to invite project member", data),
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
}
