/**
 * Issue validation utilities
 */

import type { CreateIssueInput, UpdateIssueInput } from "../contracts";
import type { IssuePriority, IssueStatus } from "../types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "../types";
import { isValidStatusTransition } from "./issue-state-machine";
import { createRepositoryError } from "./repository-errors";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateIssueInput(
  input: CreateIssueInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push({ field: "title", message: "제목은 필수입니다." });
  } else if (input.title.length > 500) {
    errors.push({
      field: "title",
      message: "제목은 500자 이하여야 합니다.",
    });
  }

  if (!input.projectId || input.projectId.trim() === "") {
    errors.push({ field: "projectId", message: "프로젝트 ID는 필수입니다." });
  }

  if (!input.createdBy || input.createdBy.trim() === "") {
    errors.push({ field: "createdBy", message: "생성자 ID는 필수입니다." });
  }

  if (input.status && !ISSUE_STATUSES.includes(input.status)) {
    errors.push({
      field: "status",
      message: `유효하지 않은 상태입니다. 유효한 값: ${ISSUE_STATUSES.join(", ")}`,
    });
  }

  if (input.priority && !ISSUE_PRIORITIES.includes(input.priority)) {
    errors.push({
      field: "priority",
      message: `유효하지 않은 우선순위입니다. 유효한 값: ${ISSUE_PRIORITIES.join(", ")}`,
    });
  }

  if (input.description !== undefined && input.description.length > 10000) {
    errors.push({
      field: "description",
      message: "설명은 10,000자 이하여야 합니다.",
    });
  }

  if (input.assigneeId && input.assigneeId.trim() === "") {
    errors.push({
      field: "assigneeId",
      message: "담당자 ID는 비어있을 수 없습니다.",
    });
  }

  return errors;
}

export function validateUpdateIssueInput(
  input: UpdateIssueInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input.title !== undefined) {
    if (input.title.trim().length === 0) {
      errors.push({ field: "title", message: "제목은 비어있을 수 없습니다." });
    } else if (input.title.length > 500) {
      errors.push({
        field: "title",
        message: "제목은 500자 이하여야 합니다.",
      });
    }
  }

  if (input.status && !ISSUE_STATUSES.includes(input.status)) {
    errors.push({
      field: "status",
      message: `유효하지 않은 상태입니다. 유효한 값: ${ISSUE_STATUSES.join(", ")}`,
    });
  }

  if (input.priority && !ISSUE_PRIORITIES.includes(input.priority)) {
    errors.push({
      field: "priority",
      message: `유효하지 않은 우선순위입니다. 유효한 값: ${ISSUE_PRIORITIES.join(", ")}`,
    });
  }

  if (input.description !== undefined && input.description.length > 10000) {
    errors.push({
      field: "description",
      message: "설명은 10,000자 이하여야 합니다.",
    });
  }

  if (input.dueDate !== undefined && input.dueDate !== null) {
    const dueDate = new Date(input.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push({
        field: "dueDate",
        message: "유효하지 않은 날짜 형식입니다.",
      });
    }
  }

  if (input.updatedBy && input.updatedBy.trim() === "") {
    errors.push({
      field: "updatedBy",
      message: "업데이터 ID는 필수입니다.",
    });
  }

  return errors;
}

export function validateStatusTransition(
  currentStatus: IssueStatus,
  newStatus: IssueStatus
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isValidStatusTransition(currentStatus, newStatus)) {
    errors.push({
      field: "status",
      message: `${currentStatus}에서 ${newStatus}(으)로 변경할 수 없습니다.`,
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

export function assertValidCreateIssueInput(input: CreateIssueInput): void {
  const errors = validateCreateIssueInput(input);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}

export function assertValidUpdateIssueInput(input: UpdateIssueInput): void {
  const errors = validateUpdateIssueInput(input);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}

export function assertValidStatusTransition(
  currentStatus: IssueStatus,
  newStatus: IssueStatus
): void {
  const errors = validateStatusTransition(currentStatus, newStatus);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}
