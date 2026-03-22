import { isRepositoryError } from "@/features/issues/lib/repository-errors";

export function getUpdateProjectErrorMessage(error: unknown): string {
  if (isRepositoryError(error)) {
    if (error.code === "PROJECT_KEY_TAKEN") {
      return "That project key is already in use. Choose a different key.";
    }

    if (error.code === "AUTH_REQUIRED") {
      return "Your session expired. Sign in again and retry.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to update this project right now.";
    }
  }

  return "We couldn't update the project. Review the details and try again.";
}
