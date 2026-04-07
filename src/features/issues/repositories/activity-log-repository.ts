import {
  assertDataPresent,
  assertQuerySucceeded,
  mapActivityLogEntry,
} from "@/features/issues/repositories/issue-repository-helpers";
import type { ActivityLogEntry } from "@/features/issues/types";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { Json } from "@/lib/supabase/types";

export class SupabaseActivityLogRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">
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

    return mapActivityLogEntry(
      assertDataPresent("Failed to append activity log", data)
    );
  }

  async listActivityLogByIssueId(issueId: string): Promise<ActivityLogEntry[]> {
    const { data, error } = await this.client
      .from("activity_logs")
      .select(
        "id, issue_id, project_id, actor_id, type, field, from_value, to_value, summary, created_at"
      )
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to list activity log", error);

    return data ? data.map(mapActivityLogEntry) : [];
  }
}
