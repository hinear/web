import { isRepositoryError } from "@/features/issues/lib/repository-errors";

export function getCreateProjectErrorMessage(error: unknown): string {
  if (isRepositoryError(error)) {
    if (error.code === "PROJECT_KEY_TAKEN") {
      return "That project key is already in use. Choose a different key.";
    }

    if (error.code === "AUTH_REQUIRED") {
      return "Your session expired. Sign in again and retry.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to create a project right now.";
    }
  }

  return "We couldn't create the project. Review the details and try again.";
}
