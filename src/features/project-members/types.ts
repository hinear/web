/**
 * ProjectMember domain models
 */

export type MemberRole = "owner" | "member";

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: MemberRole;
  createdAt: string;
}

export interface ProjectMemberWithUser extends ProjectMember {
  userName: string;
  userEmail: string | null;
  userAvatarUrl: string | null;
}

export interface MemberPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canChangeSettings: boolean;
}

export type Permission =
  | "read"
  | "write"
  | "delete"
  | "manage_members"
  | "settings";

/**
 * Role-based access control matrix
 */
export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  owner: ["read", "write", "delete", "manage_members", "settings"],
  member: ["read", "write"],
} as const;

export function hasPermission(
  role: MemberRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissions(role: MemberRole): MemberPermissions {
  const permissions = ROLE_PERMISSIONS[role];

  return {
    canRead: permissions.includes("read"),
    canWrite: permissions.includes("write"),
    canDelete: permissions.includes("delete"),
    canManageMembers: permissions.includes("manage_members"),
    canChangeSettings: permissions.includes("settings"),
  };
}
