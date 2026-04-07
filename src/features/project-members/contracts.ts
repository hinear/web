/**
 * ProjectMember domain input/output contracts
 */

import type { ProjectMemberRole } from "@/features/projects/types";
import type { MemberRole, ProjectMember } from "./types";

// Client-facing action input types (no user identity fields — injected from session)
export interface AddMemberActionInput {
  projectId: string;
  userId: string;
  role: MemberRole;
}

export interface RemoveMemberActionInput {
  projectId: string;
  userId: string;
}

export interface UpdateRoleActionInput {
  projectId: string;
  userId: string;
  role: MemberRole;
}

export interface CheckAccessActionInput {
  projectId: string;
  permission: string;
}

export interface GetMemberRoleActionInput {
  projectId: string;
}

// Repository-facing input types (include server-injected identity fields)
export interface AddMemberInput {
  projectId: string;
  userId: string;
  role: MemberRole;
  addedBy: string;
}

export interface RemoveMemberInput {
  projectId: string;
  userId: string;
  removedBy: string;
}

export interface UpdateRoleInput {
  projectId: string;
  userId: string;
  role: MemberRole;
  updatedBy: string;
}

export interface CheckAccessInput {
  projectId: string;
  userId: string;
  permission: string;
}

export interface ListMembersInput {
  projectId: string;
  includeUserDetails?: boolean;
}

export interface GetMemberRoleInput {
  projectId: string;
  userId: string;
}

export interface ListUserProjectsInput {
  userId: string;
}

export interface ProjectMembersRepository {
  // Core CRUD
  addMember(input: AddMemberInput): Promise<ProjectMember>;
  removeMember(input: RemoveMemberInput): Promise<void>;
  updateRole(input: UpdateRoleInput): Promise<ProjectMember>;
  listMembers(input: ListMembersInput): Promise<ProjectMember[]>;

  // Authorization - Critical
  isProjectMember(projectId: string, userId: string): Promise<boolean>;
  hasProjectPermission(
    projectId: string,
    userId: string,
    permission: string
  ): Promise<boolean>;
  getMemberRole(input: GetMemberRoleInput): Promise<MemberRole | null>;
  getMemberById(
    projectId: string,
    userId: string
  ): Promise<ProjectMember | null>;

  // User-facing
  listUserProjects(userId: string): Promise<Project[]>;
  listUserMemberships(userId: string): Promise<ProjectMember[]>;

  // Validation helpers
  isLastOwner(projectId: string): Promise<boolean>;
  canUserBeAdded(projectId: string, userId: string): Promise<boolean>;
}

// Forward declaration for Project
export interface Project {
  id: string;
  name: string;
  key: string;
}

export interface ProjectMemberResource {
  createdAt: string;
  projectId: string;
  role: ProjectMemberRole;
  userId: string;
}

export interface AddProjectMemberRequest {
  role: ProjectMemberRole;
  userId: string;
}
