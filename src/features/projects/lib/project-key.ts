/**
 * Project key validation and utilities
 */

import { createRepositoryError } from "@/features/issues/lib/repository-errors";

const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]+$/;
const MIN_LENGTH = 2;
const MAX_LENGTH = 10;

export function normalizeProjectKey(projectKey: string): string {
  return projectKey.trim().toUpperCase();
}

export function isValidProjectKey(projectKey: string): boolean {
  const normalized = normalizeProjectKey(projectKey);
  return (
    PROJECT_KEY_PATTERN.test(normalized) &&
    normalized.length >= MIN_LENGTH &&
    normalized.length <= MAX_LENGTH
  );
}

export function assertProjectKey(projectKey: string): string {
  const normalizedProjectKey = normalizeProjectKey(projectKey);

  if (!PROJECT_KEY_PATTERN.test(normalizedProjectKey)) {
    throw new Error(
      "Project key must contain only uppercase letters and numbers."
    );
  }

  if (normalizedProjectKey.length < MIN_LENGTH) {
    throw new Error(`Project key must be at least ${MIN_LENGTH} characters.`);
  }

  if (normalizedProjectKey.length > MAX_LENGTH) {
    throw new Error(`Project key must be at most ${MAX_LENGTH} characters.`);
  }

  return normalizedProjectKey;
}

/**
 * Detailed validation with error messages
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateProjectKey(key: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!key || key.trim().length === 0) {
    errors.push({ field: "key", message: "프로젝트 키는 필수입니다." });
    return errors;
  }

  const trimmedKey = key.trim();

  if (trimmedKey.length < MIN_LENGTH) {
    errors.push({
      field: "key",
      message: `프로젝트 키는 최소 ${MIN_LENGTH}자 이상이어야 합니다.`,
    });
  }

  if (trimmedKey.length > MAX_LENGTH) {
    errors.push({
      field: "key",
      message: `프로젝트 키는 최대 ${MAX_LENGTH}자까지 가능합니다.`,
    });
  }

  if (!PROJECT_KEY_PATTERN.test(trimmedKey)) {
    errors.push({
      field: "key",
      message:
        "프로젝트 키는 대문자와 숫자만 사용할 수 있으며, 문자로 시작해야 합니다.",
    });
  }

  return errors;
}

/**
 * Check if project key is available (not taken)
 */
export async function isProjectKeyAvailable(
  key: string,
  checkFn: (key: string) => Promise<boolean>
): Promise<boolean> {
  const exists = await checkFn(key);
  return !exists;
}

/**
 * Generate project key suggestions from project name
 */
export function generateProjectKeySuggestions(
  projectName: string,
  count: number = 3
): string[] {
  const words = projectName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  const suggestions: string[] = [];

  // First word or first 3-5 letters
  if (words.length > 0) {
    const firstWord = words[0];
    suggestions.push(
      firstWord.slice(0, MAX_LENGTH),
      `${firstWord.slice(0, 3)}1`,
      `${firstWord.slice(0, 4)}1`
    );
  }

  // Acronym from first letters
  if (words.length >= 2) {
    const acronym = words.slice(0, Math.min(4, words.length)).join("");
    suggestions.push(acronym.slice(0, MAX_LENGTH));
  }

  // Filter valid suggestions
  const validSuggestions = suggestions.filter((s) => isValidProjectKey(s));

  // Fallback suggestions
  const fallbacks = ["PROJ", "TEAM", "WORK", "TASK", "APP"];
  for (const fallback of fallbacks) {
    if (validSuggestions.length < count) {
      validSuggestions.push(fallback);
    }
  }

  return validSuggestions.slice(0, count);
}

/**
 * Format project key for display
 */
export function formatProjectKey(key: string): string {
  return key.trim().toUpperCase();
}

/**
 * Throw validation error if validation fails
 */
export function throwValidationError(errors: ValidationError[]): never {
  throw createRepositoryError(
    "VALIDATION_ERROR",
    errors.map((e) => `${e.field}: ${e.message}`).join("; ")
  );
}

/**
 * Assert valid project key with detailed errors
 */
export function assertValidProjectKey(key: string): void {
  const errors = validateProjectKey(key);
  if (errors.length > 0) {
    throwValidationError(errors);
  }
}
