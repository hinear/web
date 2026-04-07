/**
 * Comment validation utilities
 */

import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import type {
  CreateCommentActionInput,
  UpdateCommentActionInput,
} from "../contracts";

export const COMMENT_MIN_LENGTH = 1;
export const COMMENT_MAX_LENGTH = 10_000;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateCommentInput(
  input: CreateCommentActionInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.issueId || input.issueId.trim() === "") {
    errors.push({ field: "issueId", message: "Issue ID is required." });
  }

  if (!input.projectId || input.projectId.trim() === "") {
    errors.push({ field: "projectId", message: "Project ID is required." });
  }

  if (!input.body || input.body.trim() === "") {
    errors.push({ field: "body", message: "Comment body cannot be empty." });
  } else if (input.body.length > COMMENT_MAX_LENGTH) {
    errors.push({
      field: "body",
      message: `Comment body cannot exceed ${COMMENT_MAX_LENGTH} characters.`,
    });
  }

  // Check for whitespace-only content
  if (input.body.trim().length === 0 && input.body.length > 0) {
    errors.push({
      field: "body",
      message: "Comment body cannot contain only whitespace.",
    });
  }

  return errors;
}

export function validateUpdateCommentInput(
  input: UpdateCommentActionInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.commentId || input.commentId.trim() === "") {
    errors.push({ field: "commentId", message: "Comment ID is required." });
  }

  if (!input.body || input.body.trim() === "") {
    errors.push({ field: "body", message: "Comment body cannot be empty." });
  } else if (input.body.length > COMMENT_MAX_LENGTH) {
    errors.push({
      field: "body",
      message: `Comment body cannot exceed ${COMMENT_MAX_LENGTH} characters.`,
    });
  }

  return errors;
}

export function throwValidationError(errors: ValidationError[]): never {
  throw createRepositoryError(
    "UNKNOWN",
    errors.map((e) => `${e.field}: ${e.message}`).join("; ")
  );
}

export function assertValidCreateCommentInput(
  input: CreateCommentActionInput
): void {
  const errors = validateCreateCommentInput(input);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}

export function assertValidUpdateCommentInput(
  input: UpdateCommentActionInput
): void {
  const errors = validateUpdateCommentInput(input);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}
