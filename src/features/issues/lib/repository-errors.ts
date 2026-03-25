import type { PostgrestError } from "@supabase/supabase-js";

export type RepositoryErrorCode =
  | "ACCESS_DENIED"
  | "ALREADY_MEMBER"
  | "AUTH_REQUIRED"
  | "COMMENT_NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "ISSUE_NOT_FOUND"
  | "LAST_OWNER"
  | "NOT_MEMBER"
  | "OWNER_EXISTS"
  | "PARENT_COMMENT_NOT_FOUND"
  | "PROJECT_KEY_TAKEN"
  | "PROJECT_INVITATION_EXISTS"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export class RepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message: string,
    public readonly status: number = getRepositoryErrorStatus(code)
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export function getRepositoryErrorStatus(code: RepositoryErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "ACCESS_DENIED":
    case "FORBIDDEN":
      return 403;
    case "COMMENT_NOT_FOUND":
    case "ISSUE_NOT_FOUND":
    case "NOT_MEMBER":
    case "PARENT_COMMENT_NOT_FOUND":
      return 404;
    case "ALREADY_MEMBER":
    case "CONFLICT":
    case "LAST_OWNER":
    case "OWNER_EXISTS":
    case "PROJECT_KEY_TAKEN":
    case "PROJECT_INVITATION_EXISTS":
      return 409;
    default:
      return 500;
  }
}

export function isRepositoryError(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError;
}

export function createRepositoryError(
  code: RepositoryErrorCode,
  message: string
): RepositoryError {
  return new RepositoryError(code, message);
}

export function createPostgrestRepositoryError(
  context: string,
  error: PostgrestError
): RepositoryError {
  const message = `${context}: ${error.message}`;
  const normalized = error.message.toLowerCase();
  const details = error.details?.toLowerCase() ?? "";
  const combined = `${normalized} ${details}`;

  if (error.code === "23505") {
    if (combined.includes("projects_key_key")) {
      return createRepositoryError(
        "PROJECT_KEY_TAKEN",
        "Project key already exists."
      );
    }

    if (combined.includes("project_invitations_pending_email_idx")) {
      return createRepositoryError(
        "PROJECT_INVITATION_EXISTS",
        "A pending invitation already exists for this email."
      );
    }
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("not allowed")
  ) {
    return createRepositoryError("FORBIDDEN", message);
  }

  if (normalized.includes("jwt") || normalized.includes("auth")) {
    return createRepositoryError("AUTH_REQUIRED", message);
  }

  return createRepositoryError("UNKNOWN", message);
}
