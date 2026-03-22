import {
  getRepositoryErrorStatus,
  isRepositoryError,
} from "@/features/issues/lib/repository-errors";

export type MutationAction = "board" | "comment" | "issue";

export type MutationErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_COMMENT_BODY"
  | "INVALID_ISSUE_UPDATE"
  | "INVALID_TITLE"
  | "ISSUE_NOT_FOUND"
  | "UNKNOWN"
  | "VERSION_REQUIRED";

interface MutationErrorMessageOptions {
  actionLabel: MutationAction;
  code?: string | null;
  fallbackMessage?: string | null;
  status: number;
}

function getDefaultActionFailureMessage(actionLabel: MutationAction): string {
  if (actionLabel === "board") {
    return "We couldn't update the board. Try again.";
  }

  return actionLabel === "comment"
    ? "We couldn't post your comment. Try again."
    : "We couldn't save your changes. Try again.";
}

export function getMutationErrorMessage({
  actionLabel,
  code,
  fallbackMessage,
  status,
}: MutationErrorMessageOptions): string {
  if (status === 401 || code === "AUTH_REQUIRED") {
    return actionLabel === "board"
      ? "Your session expired. Sign in again, then refresh the board."
      : "Your session expired. Sign in again and retry.";
  }

  if (status === 403 || code === "FORBIDDEN") {
    return actionLabel === "board"
      ? "You no longer have access to this project. Return to your projects and refresh."
      : "You no longer have access to this issue. Return to the board and refresh.";
  }

  if (status === 404 || code === "ISSUE_NOT_FOUND") {
    return actionLabel === "board"
      ? "This issue no longer exists. Refresh the board to load the latest list."
      : "This issue no longer exists. Return to the board and refresh your list.";
  }

  if (code === "INVALID_TITLE") {
    return "Enter a title before saving.";
  }

  if (code === "INVALID_COMMENT_BODY") {
    return "Enter a comment before posting.";
  }

  if (code === "VERSION_REQUIRED" || code === "INVALID_ISSUE_UPDATE") {
    return actionLabel === "board"
      ? "We couldn't update that issue on the board. Refresh and try again."
      : "We couldn't save those changes. Refresh the issue and try again.";
  }

  if (status >= 500) {
    return getDefaultActionFailureMessage(actionLabel);
  }

  return fallbackMessage?.trim() || getDefaultActionFailureMessage(actionLabel);
}

export function getMutationErrorCode(
  value: unknown
): MutationErrorCode | undefined {
  if (!value || typeof value !== "object" || !("code" in value)) {
    return undefined;
  }

  const { code } = value as { code?: unknown };
  return typeof code === "string" ? (code as MutationErrorCode) : undefined;
}

export function getMutationErrorFallbackMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return null;
  }

  const { error } = value as { error?: unknown };
  return typeof error === "string" ? error : null;
}

export function inferMutationErrorCode(error: unknown): MutationErrorCode {
  if (isRepositoryError(error)) {
    return error.code;
  }

  if (!(error instanceof Error)) {
    return "UNKNOWN";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not allowed")
  ) {
    return "FORBIDDEN";
  }

  if (message.includes("issue not found")) {
    return "ISSUE_NOT_FOUND";
  }

  if (message.includes("authentication required")) {
    return "AUTH_REQUIRED";
  }

  return "UNKNOWN";
}

export function getMutationErrorStatus(code: MutationErrorCode): number {
  if (
    code === "AUTH_REQUIRED" ||
    code === "FORBIDDEN" ||
    code === "ISSUE_NOT_FOUND"
  ) {
    return getRepositoryErrorStatus(code);
  }

  switch (code) {
    default:
      return 500;
  }
}
