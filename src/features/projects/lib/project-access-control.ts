/**
 * Project access control utilities
 * Access validation logic
 */

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import type { ProjectType } from "../types";

/**
 * Access levels for project operations
 */
export type ProjectAccessLevel = "read" | "write" | "admin" | "owner";

/**
 * Required access levels for common operations
 */
export const OPERATION_ACCESS_LEVELS: Record<string, ProjectAccessLevel> = {
  view_project: "read",
  create_issue: "write",
  edit_issue: "write",
  delete_issue: "write",
  manage_members: "admin",
  change_settings: "admin",
  delete_project: "owner",
  transfer_ownership: "owner",
} as const;

/**
 * Check if user has required access level
 */
export function hasAccessLevel(
  userLevel: ProjectAccessLevel,
  requiredLevel: ProjectAccessLevel
): boolean {
  const levels: Record<ProjectAccessLevel, number> = {
    read: 1,
    write: 2,
    admin: 3,
    owner: 4,
  };

  return levels[userLevel] >= levels[requiredLevel];
}

/**
 * Get access level from member role
 */
export function getAccessLevelFromRole(
  role: "owner" | "member",
  projectType: ProjectType
): ProjectAccessLevel {
  // Personal projects: owner has full control
  if (projectType === "personal") {
    return role === "owner" ? "owner" : "read";
  }

  // Team projects: owner has admin, member has write
  return role === "owner" ? "admin" : "write";
}

/**
 * Check if user can perform operation
 */
export function canPerformOperation(
  userRole: "owner" | "member",
  projectType: ProjectType,
  operation: string
): boolean {
  const userAccessLevel = getAccessLevelFromRole(userRole, projectType);
  const requiredLevel = OPERATION_ACCESS_LEVELS[operation];

  if (!requiredLevel) {
    // Unknown operation - deny by default
    return false;
  }

  return hasAccessLevel(userAccessLevel, requiredLevel);
}

/**
 * Validate project access
 */
export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

export function checkProjectAccess(
  userRole: "owner" | "member" | null,
  projectType: ProjectType,
  operation: string
): AccessDecision {
  if (!userRole) {
    return {
      allowed: false,
      reason: "프로젝트에 속해 있지 않습니다.",
    };
  }

  const canPerform = canPerformOperation(userRole, projectType, operation);

  if (!canPerform) {
    const requiredLevel = OPERATION_ACCESS_LEVELS[operation];
    return {
      allowed: false,
      reason: `이 작업을 수행할 권한이 없습니다. 필요 권한: ${requiredLevel}`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user is project owner
 */
export function isProjectOwner(role: "owner" | "member"): boolean {
  return role === "owner";
}

/**
 * Check if user can manage project members
 */
export function canManageMembers(role: "owner" | "member"): boolean {
  return role === "owner";
}

/**
 * Check if user can change project settings
 */
export function canChangeSettings(role: "owner" | "member"): boolean {
  return role === "owner";
}

/**
 * Check if user can delete project
 */
export function canDeleteProject(role: "owner" | "member"): boolean {
  return role === "owner";
}

/**
 * Check if user can transfer ownership
 */
export function canTransferOwnership(role: "owner" | "member"): boolean {
  return role === "owner";
}

/**
 * Throw error if access denied
 */
export function requireAccess(
  decision: AccessDecision,
  context: string = "작업"
): void {
  if (!decision.allowed) {
    throw createRepositoryError(
      "ACCESS_DENIED",
      decision.reason || `${context}를 수행할 권한이 없습니다.`
    );
  }
}

/**
 * Assert user is project owner
 */
export function assertProjectOwner(role: "owner" | "member"): void {
  if (!isProjectOwner(role)) {
    throw createRepositoryError(
      "ACCESS_DENIED",
      "이 작업은 프로젝트 소유자만 수행할 수 있습니다."
    );
  }
}
