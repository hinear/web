/**
 * Access control utilities
 * Fine-grained access control logic
 */

import type { MemberRole, Permission } from "../types";
import {
  canChangeSettings,
  canDelete,
  canManageMembers,
  canRead,
  canWrite,
} from "./permission-checker";
import {
  canDemoteFromOwner,
  canPromoteToOwner,
  isValidRoleTransition,
} from "./role-manager";

/**
 * Access control decision
 */
export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user can add a member to the project
 */
export function canAddMember(actorRole: MemberRole): AccessDecision {
  if (!canManageMembers(actorRole)) {
    return {
      allowed: false,
      reason: "멤버를 추가할 권한이 없습니다. 소유자만 가능합니다.",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can remove a member from the project
 */
export function canRemoveMember(
  actorRole: MemberRole,
  targetRole: MemberRole,
  isLastOwner: boolean
): AccessDecision {
  if (!canManageMembers(actorRole)) {
    return {
      allowed: false,
      reason: "멤버를 제거할 권한이 없습니다. 소유자만 가능합니다.",
    };
  }

  if (targetRole === "owner" && isLastOwner) {
    return {
      allowed: false,
      reason: "마지막 소유자는 제거할 수 없습니다.",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can update a member's role
 */
export function canUpdateMemberRole(
  actorRole: MemberRole,
  currentRole: MemberRole,
  newRole: MemberRole,
  isLastOwner: boolean
): AccessDecision {
  if (!canManageMembers(actorRole)) {
    return {
      allowed: false,
      reason: "역할을 변경할 권한이 없습니다. 소유자만 가능합니다.",
    };
  }

  if (currentRole === "owner" && newRole !== "owner" && isLastOwner) {
    return {
      allowed: false,
      reason: "마지막 소유자의 역할을 변경할 수 없습니다.",
    };
  }

  if (newRole === "owner" && !isLastOwner) {
    return {
      allowed: false,
      reason: "이미 소유자가 있는 프로젝트에는 새 소유자를 추가할 수 없습니다.",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can change project settings
 */
export function canModifyProjectSettings(role: MemberRole): AccessDecision {
  if (!canChangeSettings(role)) {
    return {
      allowed: false,
      reason: "프로젝트 설정을 변경할 권한이 없습니다.",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can delete an issue
 */
export function canDeleteIssue(role: MemberRole): AccessDecision {
  if (!canDelete(role)) {
    return {
      allowed: false,
      reason: "이슈를 삭제할 권한이 없습니다.",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can edit an issue
 */
export function canEditIssue(role: MemberRole): AccessDecision {
  if (!canWrite(role)) {
    return {
      allowed: false,
      reason: "이슈를 편집할 권한이 없습니다.",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can view the project
 */
export function canViewProject(role: MemberRole): AccessDecision {
  if (!canRead(role)) {
    return {
      allowed: false,
      reason: "프로젝트를 볼 권한이 없습니다.",
    };
  }

  return { allowed: true };
}

/**
 * Generic permission check
 */
export function checkPermission(
  role: MemberRole,
  permission: Permission
): AccessDecision {
  const permissionChecks: Record<
    Permission,
    (role: MemberRole) => AccessDecision
  > = {
    read: canViewProject,
    write: canEditIssue,
    delete: canDeleteIssue,
    manage_members: () => canAddMember(role),
    settings: canModifyProjectSettings,
  };

  return (
    permissionChecks[permission]?.(role) ?? {
      allowed: false,
      reason: "알 수 없는 권한입니다.",
    }
  );
}

/**
 * Batch check multiple permissions
 */
export function checkAllPermissions(
  role: MemberRole,
  permissions: Permission[]
): AccessDecision {
  for (const permission of permissions) {
    const decision = checkPermission(role, permission);
    if (!decision.allowed) {
      return decision;
    }
  }

  return { allowed: true };
}
