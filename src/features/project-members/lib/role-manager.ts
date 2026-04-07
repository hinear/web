/**
 * Role management utilities
 * Handle role transitions, restrictions
 */

import type { MemberRole } from "../types";

/**
 * Valid role transitions
 * Defines which roles can be changed to which other roles
 */
export const VALID_ROLE_TRANSITIONS: Record<MemberRole, MemberRole[]> = {
  owner: ["member"], // Owner can demote themselves to member (if not last)
  member: ["owner"], // Member can be promoted to owner (if no owner)
} as const;

/**
 * Check if a role transition is valid
 */
export function isValidRoleTransition(
  fromRole: MemberRole,
  toRole: MemberRole
): boolean {
  if (fromRole === toRole) {
    return true; // No change is valid
  }

  return VALID_ROLE_TRANSITIONS[fromRole]?.includes(toRole) ?? false;
}

/**
 * Check if user can promote another user to owner
 * Only allowed if there's no current owner
 */
export function canPromoteToOwner(
  _isCurrentOwner: boolean,
  isLastOwner: boolean
): boolean {
  // Can only promote if there's no owner yet
  return isLastOwner;
}

/**
 * Check if user can demote from owner
 * Only allowed if they're not the last owner
 */
export function canDemoteFromOwner(isLastOwner: boolean): boolean {
  return !isLastOwner;
}

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(role: MemberRole): string {
  const displayNames: Record<MemberRole, string> = {
    owner: "소유자",
    member: "멤버",
  };

  return displayNames[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: MemberRole): string {
  const descriptions: Record<MemberRole, string> = {
    owner: "프로젝트 소유자 - 모든 권한 보유 (멤버 관리, 설정 변경, 삭제 포함)",
    member: "프로젝트 멤버 - 읽기 및 쓰기 권한",
  };

  return descriptions[role];
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: MemberRole): string {
  const colors: Record<MemberRole, string> = {
    owner: "bg-purple-100 text-purple-800 border-purple-200",
    member: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return colors[role];
}

/**
 * Compare roles for hierarchy
 * Returns > 0 if role1 > role2, < 0 if role1 < role2, 0 if equal
 */
export function compareRoles(role1: MemberRole, role2: MemberRole): number {
  const hierarchy: Record<MemberRole, number> = {
    owner: 2,
    member: 1,
  };

  return hierarchy[role1] - hierarchy[role2];
}

/**
 * Check if role1 has higher authority than role2
 */
export function hasHigherAuthority(
  role1: MemberRole,
  role2: MemberRole
): boolean {
  return compareRoles(role1, role2) > 0;
}

/**
 * Get all available roles
 */
export function getAllRoles(): MemberRole[] {
  return ["owner", "member"];
}

/**
 * Check if a role string is valid
 */
export function isValidRole(role: string): role is MemberRole {
  return ["owner", "member"].includes(role);
}

/**
 * Sort members by role (owner first), then by name alphabetically
 */
export function sortMembersByRole<
  T extends { role: MemberRole; userName?: string | null },
>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (a.role !== "owner" && b.role === "owner") return 1;
    return (a.userName ?? "").localeCompare(b.userName ?? "");
  });
}
