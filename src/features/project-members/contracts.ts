/**
 * ProjectMember domain input/output contracts
 */

import type { MemberRole, ProjectMember } from "./types";

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
