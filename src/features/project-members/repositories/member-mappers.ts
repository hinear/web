import type { PostgrestError } from "@supabase/supabase-js";

import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type { TableRow } from "@/lib/supabase/types";
import type { MemberRole, ProjectMember } from "../types";

export function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw createPostgrestRepositoryError(context, error);
  }
}

export function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw createRepositoryError(
      "UNKNOWN",
      `${context}: query returned no rows.`
    );
  }

  return data;
}

export function mapProjectMember(
  row: TableRow<"project_members">
): ProjectMember {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role as MemberRole,
    createdAt: row.created_at,
  };
}

export function isProjectSummary(
  value: unknown
): value is { id: string; key: string; name: string } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      "key" in value
  );
}
