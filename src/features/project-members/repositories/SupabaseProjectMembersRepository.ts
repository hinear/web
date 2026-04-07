import "server-only";

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import type {
  AddMemberInput,
  GetMemberRoleInput,
  ListMembersInput,
  Project,
  ProjectMembersRepository,
  RemoveMemberInput,
  UpdateRoleInput,
} from "@/features/project-members/contracts";
import type {
  MemberRole,
  ProjectMember,
} from "@/features/project-members/types";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableRow } from "@/lib/supabase/types";
import {
  assertDataPresent,
  assertQuerySucceeded,
  isProjectSummary,
  mapProjectMember,
} from "./member-mappers";

export class SupabaseProjectMembersRepository
  implements ProjectMembersRepository
{
  constructor(private readonly client: AppSupabaseServerClient) {}

  async addMember(input: AddMemberInput): Promise<ProjectMember> {
    const existing = await this.getMemberById(input.projectId, input.userId);
    if (existing) {
      throw createRepositoryError(
        "ALREADY_MEMBER",
        "User is already a member of this project."
      );
    }

    if (input.role === "owner") {
      const isLast = await this.isLastOwner(input.projectId);
      if (!isLast) {
        throw createRepositoryError(
          "OWNER_EXISTS",
          "Project already has an owner."
        );
      }
    }

    const { data, error } = await this.client
      .from("project_members")
      .insert({
        project_id: input.projectId,
        user_id: input.userId,
        role: input.role,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to add member", error);

    return mapProjectMember(assertDataPresent("Failed to add member", data));
  }

  async removeMember(input: RemoveMemberInput): Promise<void> {
    // Check if removing the last owner
    const member = await this.getMemberById(input.projectId, input.userId);

    if (!member) {
      throw createRepositoryError(
        "NOT_MEMBER",
        "User is not a member of this project."
      );
    }

    if (member.role === "owner") {
      const isLast = await this.isLastOwner(input.projectId);
      if (isLast) {
        throw createRepositoryError(
          "LAST_OWNER",
          "Cannot remove the last owner of a project."
        );
      }
    }

    const { error } = await this.client
      .from("project_members")
      .delete()
      .eq("project_id", input.projectId)
      .eq("user_id", input.userId);

    assertQuerySucceeded("Failed to remove member", error);
  }

  async updateRole(input: UpdateRoleInput): Promise<ProjectMember> {
    // Fetch existing member and owner count in parallel
    const [existing, ownerCount] = await Promise.all([
      this.getMemberById(input.projectId, input.userId),
      this.getOwnerCount(input.projectId),
    ]);

    if (!existing) {
      throw createRepositoryError(
        "NOT_MEMBER",
        "User is not a member of this project."
      );
    }

    const isLast = ownerCount <= 1;

    // Check if changing to owner and there's already an owner
    if (input.role === "owner" && !isLast) {
      throw createRepositoryError(
        "OWNER_EXISTS",
        "Project already has an owner. Only one owner allowed per project."
      );
    }

    // Check if changing away from owner and this is the only owner
    if (existing.role === "owner" && input.role !== "owner" && isLast) {
      throw createRepositoryError(
        "LAST_OWNER",
        "Cannot change the role of the last owner."
      );
    }

    const { data, error } = await this.client
      .from("project_members")
      .update({ role: input.role })
      .eq("project_id", input.projectId)
      .eq("user_id", input.userId)
      .select()
      .single();

    assertQuerySucceeded("Failed to update role", error);

    return mapProjectMember(assertDataPresent("Failed to update role", data));
  }

  async listMembers(input: ListMembersInput): Promise<ProjectMember[]> {
    if (input.includeUserDetails) {
      const { data, error } = await this.client
        .from("project_members")
        .select(
          `
          project_id,
          user_id,
          role,
          created_at,
          user:user_id (
            email,
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'avatar_url'
          )
        `
        )
        .eq("project_id", input.projectId)
        .order("created_at", {
          ascending: true,
        });

      assertQuerySucceeded("Failed to list members", error);

      return ((data ?? []) as unknown as TableRow<"project_members">[]).map(
        mapProjectMember
      );
    }

    const { data, error } = await this.client
      .from("project_members")
      .select()
      .eq("project_id", input.projectId)
      .order("created_at", {
        ascending: true,
      });

    assertQuerySucceeded("Failed to list members", error);

    return (data ?? []).map(mapProjectMember);
  }

  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    assertQuerySucceeded("Failed to check membership", error);

    return data !== null;
  }

  async hasProjectPermission(
    projectId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    const member = await this.getMemberById(projectId, userId);
    if (!member) return false;
    const permissions: Record<string, string[]> = {
      owner: ["read", "write", "delete", "manage_members", "settings"],
      member: ["read", "write"],
    };
    return permissions[member.role]?.includes(permission) ?? false;
  }

  async getMemberRole(input: GetMemberRoleInput): Promise<MemberRole | null> {
    const member = await this.getMemberById(input.projectId, input.userId);

    return member?.role ?? null;
  }

  async getMemberById(
    projectId: string,
    userId: string
  ): Promise<ProjectMember | null> {
    const { data, error } = await this.client
      .from("project_members")
      .select()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    assertQuerySucceeded("Failed to get member", error);

    if (!data) {
      return null;
    }

    return mapProjectMember(data);
  }

  async listUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from("project_members")
      .select(`
        project_id,
        projects (
          id,
          name,
          key
        )
      `)
      .eq("user_id", userId);

    assertQuerySucceeded("Failed to list user projects", error);

    const projects: Project[] = [];

    for (const row of data ?? []) {
      const project = row.projects as unknown;
      if (isProjectSummary(project)) {
        projects.push({
          id: project.id,
          name: project.name,
          key: project.key,
        });
      }
    }

    return projects;
  }

  async listUserMemberships(userId: string): Promise<ProjectMember[]> {
    const { data, error } = await this.client
      .from("project_members")
      .select()
      .eq("user_id", userId);

    assertQuerySucceeded("Failed to list user memberships", error);

    return (data ?? []).map(mapProjectMember);
  }

  async isLastOwner(projectId: string): Promise<boolean> {
    const count = await this.getOwnerCount(projectId);
    return count <= 1;
  }

  private async getOwnerCount(projectId: string): Promise<number> {
    const { data, error } = await this.client
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("role", "owner");

    assertQuerySucceeded("Failed to check owner count", error);

    return (data ?? []).length;
  }

  async canUserBeAdded(projectId: string, userId: string): Promise<boolean> {
    const existing = await this.getMemberById(projectId, userId);

    return existing === null;
  }
}
