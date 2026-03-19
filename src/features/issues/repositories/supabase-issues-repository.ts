import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  CreateCommentInput,
  CreateIssueInput,
  IssuesRepository,
} from "@/features/issues/contracts";
import type {
  ActivityLogEntry,
  Comment,
  Issue,
} from "@/features/issues/types";
import {
  createServiceRoleSupabaseClient,
  type AppSupabaseServerClient,
} from "@/lib/supabase/server-client";
import type { Json, TableRow } from "@/lib/supabase/types";

function assertQuerySucceeded(context: string, error: PostgrestError | null): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw new Error(`${context}: query returned no rows.`);
  }

  return data;
}

function mapIssue(row: TableRow<"issues">): Issue {
  return {
    id: row.id,
    projectId: row.project_id,
    issueNumber: row.issue_number,
    identifier: row.identifier,
    title: row.title,
    status: row.status as Issue["status"],
    priority: row.priority as Issue["priority"],
    assigneeId: row.assignee_id,
    description: row.description,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComment(row: TableRow<"comments">): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapActivityLogEntry(row: TableRow<"activity_logs">): ActivityLogEntry {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    actorId: row.actor_id,
    type: row.type,
    field: row.field,
    from: row.from_value,
    to: row.to_value,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export class SupabaseIssuesRepository implements IssuesRepository {
  constructor(
    private readonly client: AppSupabaseServerClient = createServiceRoleSupabaseClient(),
  ) {}

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    const { data, error } = await this.client
      .from("issues")
      .insert({
        project_id: input.projectId,
        title: input.title,
        description: input.description ?? "",
        assignee_id: input.assigneeId ?? null,
        created_by: input.createdBy,
        updated_by: input.createdBy,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create issue", error);

    return mapIssue(assertDataPresent("Failed to create issue", data));
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .insert({
        issue_id: input.issueId,
        project_id: input.projectId,
        author_id: input.authorId,
        body: input.body,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create comment", error);

    return mapComment(assertDataPresent("Failed to create comment", data));
  }

  async appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">,
  ): Promise<ActivityLogEntry> {
    const { data, error } = await this.client
      .from("activity_logs")
      .insert({
        issue_id: entry.issueId,
        project_id: entry.projectId,
        actor_id: entry.actorId,
        type: entry.type,
        field: entry.field,
        from_value: (entry.from as Json | null) ?? null,
        to_value: (entry.to as Json | null) ?? null,
        summary: entry.summary,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to append activity log", error);

    return mapActivityLogEntry(assertDataPresent("Failed to append activity log", data));
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("id", issueId)
      .maybeSingle();

    assertQuerySucceeded("Failed to load issue", error);

    return data ? mapIssue(data) : null;
  }
}
