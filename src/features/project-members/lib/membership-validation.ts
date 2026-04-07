/**
 * Membership validation utilities
 */

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import type {
  AddMemberActionInput,
  RemoveMemberActionInput,
  UpdateRoleActionInput,
} from "../contracts";
import type { MemberRole } from "../types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateAddMemberInput(
  input: AddMemberActionInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.projectId || input.projectId.trim() === "") {
    errors.push({ field: "projectId", message: "프로젝트 ID는 필수입니다." });
  }

  if (!input.userId || input.userId.trim() === "") {
    errors.push({ field: "userId", message: "사용자 ID는 필수입니다." });
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
  input: RemoveMemberActionInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.projectId || input.projectId.trim() === "") {
    errors.push({ field: "projectId", message: "프로젝트 ID는 필수입니다." });
  }

  if (!input.userId || input.userId.trim() === "") {
    errors.push({ field: "userId", message: "사용자 ID는 필수입니다." });
  }

  return errors;
}

export function validateUpdateRoleInput(
  input: UpdateRoleActionInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.projectId || input.projectId.trim() === "") {
    errors.push({ field: "projectId", message: "프로젝트 ID는 필수입니다." });
  }

  if (!input.userId || input.userId.trim() === "") {
    errors.push({ field: "userId", message: "사용자 ID는 필수입니다." });
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

export function throwValidationErrors(errors: ValidationError[]): never {
  throw createRepositoryError(
    "VALIDATION_ERROR",
    errors.map((e) => `${e.field}: ${e.message}`).join("; ")
  );
}

export function assertValidAddMemberInput(input: AddMemberActionInput): void {
  const errors = validateAddMemberInput(input);
  if (errors.length > 0) {
    throwValidationErrors(errors);
  }
}

export function assertValidRemoveMemberInput(
  input: RemoveMemberActionInput
): void {
  const errors = validateRemoveMemberInput(input);
  if (errors.length > 0) {
    throwValidationErrors(errors);
  }
}

export function assertValidUpdateRoleInput(input: UpdateRoleActionInput): void {
  const errors = validateUpdateRoleInput(input);
  if (errors.length > 0) {
    throwValidationErrors(errors);
  }
}
