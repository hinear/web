import type { PostgrestError } from "@supabase/supabase-js";

import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type { TableInsert, TableRow } from "@/lib/supabase/types";
import type { Comment } from "../types";

export type CommentRow = TableRow<"comments"> & {
  parent_comment_id?: string | null;
  thread_id?: string | null;
  updated_at?: string | null;
};

export type CommentInsert = TableInsert<"comments"> & {
  parent_comment_id?: string | null;
  thread_id?: string | null;
};

export function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    parentCommentId: row.parent_comment_id ?? undefined,
    threadId: row.thread_id ?? undefined,
  };
}

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
