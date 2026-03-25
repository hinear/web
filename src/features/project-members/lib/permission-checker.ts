/**
 * Permission checking utilities
 * Define permission matrix by role
 */

import type { MemberRole, Permission } from "../types";

/**
 * Full permission matrix
 * Maps roles to their allowed permissions
 */
export const PERMISSION_MATRIX: Record<
  MemberRole,
  Record<Permission, boolean>
> = {
  owner: {
    read: true,
    write: true,
    delete: true,
    manage_members: true,
    settings: true,
  },
  member: {
    read: true,
    write: true,
    delete: false,
    manage_members: false,
    settings: false,
  },
} as const;

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(
  role: MemberRole,
  permission: Permission
): boolean {
  return PERMISSION_MATRIX[role]?.[permission] ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: MemberRole): Permission[] {
  return Object.entries(PERMISSION_MATRIX[role])
    .filter(([, allowed]) => allowed)
    .map(([permission]) => permission as Permission);
}

/**
 * Check if user can perform an action based on role
 */
export function canPerformAction(
  role: MemberRole,
  action: Permission
): boolean {
  return roleHasPermission(role, action);
}

/**
 * Check if user can manage members (owner only)
 */
export function canManageMembers(role: MemberRole): boolean {
  return role === "owner";
}

/**
 * Check if user can change project settings (owner only)
 */
export function canChangeSettings(role: MemberRole): boolean {
  return role === "owner";
}

/**
 * Check if user can delete issues/content
 */
export function canDelete(role: MemberRole): boolean {
  return roleHasPermission(role, "delete");
}

/**
 * Check if user can edit/create content
 */
export function canWrite(role: MemberRole): boolean {
  return roleHasPermission(role, "write");
}

/**
 * Check if user can view content
 */
export function canRead(role: MemberRole): boolean {
  return roleHasPermission(role, "read");
}

/**
 * Validate that a user has required permissions
 * Throws if permission is missing
 */
export function requirePermission(
  role: MemberRole,
  permission: Permission,
  context: string = "작업"
): void {
  if (!roleHasPermission(role, permission)) {
    throw new Error(
      `${context}를 수행할 권한이 없습니다. 필요 권한: ${permission}`
    );
  }
}

/**
 * Batch check multiple permissions
 */
export function hasAllPermissions(
  role: MemberRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => roleHasPermission(role, permission));
}

/**
 * Check if user has at least one of the required permissions
 */
export function hasAnyPermission(
  role: MemberRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => roleHasPermission(role, permission));
}
