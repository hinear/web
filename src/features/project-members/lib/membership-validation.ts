/**
 * Membership validation utilities
 */

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import type { AddMemberInput, UpdateRoleInput } from "../contracts";
import type { MemberRole } from "../types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateAddMemberInput(
  input: AddMemberInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.projectId || input.projectId.trim() === "") {
    errors.push({ field: "projectId", message: "프로젝트 ID는 필수입니다." });
  }

  if (!input.userId || input.userId.trim() === "") {
    errors.push({ field: "userId", message: "사용자 ID는 필수입니다." });
  }

  if (!input.addedBy || input.addedBy.trim() === "") {
    errors.push({
      field: "addedBy",
      message: "추가한 사용자 ID는 필수입니다.",
    });
  }

  if (!input.role) {
    errors.push({ field: "role", message: "역할은 필수입니다." });
  } else if (!["owner", "member"].includes(input.role)) {
    errors.push({
      field: "role",
      message: "역할은 'owner' 또는 'member'여야 합니다.",
    });
  }

  return errors;
}

export function validateRemoveMemberInput(
  projectId: string,
  userId: string,
  removedBy: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!projectId || projectId.trim() === "") {
    errors.push({ field: "projectId", message: "프로젝트 ID는 필수입니다." });
  }

  if (!userId || userId.trim() === "") {
    errors.push({ field: "userId", message: "사용자 ID는 필수입니다." });
  }

  if (!removedBy || removedBy.trim() === "") {
    errors.push({
      field: "removedBy",
      message: "제거한 사용자 ID는 필수입니다.",
    });
  }

  // Prevent self-removal
  if (userId === removedBy) {
    errors.push({
      field: "userId",
      message: "자기 자신을 제거할 수 없습니다.",
    });
  }

  return errors;
}

export function validateUpdateRoleInput(
  input: UpdateRoleInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.projectId || input.projectId.trim() === "") {
    errors.push({ field: "projectId", message: "프로젝트 ID는 필수입니다." });
  }

  if (!input.userId || input.userId.trim() === "") {
    errors.push({ field: "userId", message: "사용자 ID는 필수입니다." });
  }

  if (!input.updatedBy || input.updatedBy.trim() === "") {
    errors.push({
      field: "updatedBy",
      message: "업데이트한 사용자 ID는 필수입니다.",
    });
  }

  if (!input.role) {
    errors.push({ field: "role", message: "역할은 필수입니다." });
  } else if (!["owner", "member"].includes(input.role)) {
    errors.push({
      field: "role",
      message: "역할은 'owner' 또는 'member'여야 합니다.",
    });
  }

  // Prevent self-demotion from owner
  if (input.userId === input.updatedBy && input.role !== "owner") {
    errors.push({
      field: "role",
      message: "자기 자신의 역할을 변경할 수 없습니다.",
    });
  }

  return errors;
}

export function validateRoleTransition(
  currentRole: MemberRole,
  newRole: MemberRole,
  isLastOwner: boolean
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Prevent removing last owner
  if (currentRole === "owner" && newRole !== "owner" && isLastOwner) {
    errors.push({
      field: "role",
      message: "마지막 소유자의 역할을 변경할 수 없습니다.",
    });
  }

  // Prevent duplicate owner
  if (newRole === "owner" && currentRole === "member" && !isLastOwner) {
    errors.push({
      field: "role",
      message: "프로젝트에 이미 소유자가 있습니다.",
    });
  }

  return errors;
}

export function throwValidationError(errors: ValidationError[]): never {
  throw createRepositoryError(
    "VALIDATION_ERROR",
    errors.map((e) => `${e.field}: ${e.message}`).join("; ")
  );
}

export function assertValidAddMemberInput(input: AddMemberInput): void {
  const errors = validateAddMemberInput(input);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}

export function assertValidRemoveMemberInput(
  projectId: string,
  userId: string,
  removedBy: string
): void {
  const errors = validateRemoveMemberInput(projectId, userId, removedBy);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}

export function assertValidUpdateRoleInput(input: UpdateRoleInput): void {
  const errors = validateUpdateRoleInput(input);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}
