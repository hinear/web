import { resolveSession } from "../lib/auth";
import { createMcpActorSupabaseClient } from "../lib/supabase";
import type {
  BatchOperationResult,
  BatchUpdateIssuesInput,
  BatchUpdateOutput,
} from "../schemas/batch";

/**
 * Batch update multiple issues with parallel execution
 */
export async function batchUpdateIssues(
  input: BatchUpdateIssuesInput
): Promise<BatchUpdateOutput> {
  const startTime = Date.now();
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  // Process each issue update in parallel
  const updatePromises = input.issue_ids.map(async (issueId) => {
    try {
      // Build update object
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.updates.status !== undefined) {
        updateData.status = input.updates.status;
      }
      if (input.updates.priority !== undefined) {
        updateData.priority = input.updates.priority;
      }
      if (input.updates.assignee_id !== undefined) {
        updateData.assignee_id = input.updates.assignee_id;
      }

      // Execute update
      const { data, error } = await supabase
        .from("issues")
        .update(updateData)
        .eq("id", issueId)
        .select()
        .single();

      if (error || !data) {
        return {
          issue_id: issueId,
          success: false,
          error: error?.message || "Failed to update issue",
        } as BatchOperationResult;
      }

      // Add comment if provided
      if (input.comment_on_change) {
        await supabase.from("comments").insert({
          issue_id: issueId,
          content: input.comment_on_change,
          user_id: session.userId || null,
        });
      }

      return {
        issue_id: issueId,
        success: true,
        error: null,
      } as BatchOperationResult;
    } catch (error) {
      return {
        issue_id: issueId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      } as BatchOperationResult;
    }
  });

  // Wait for all updates to complete (using allSettled to handle partial failures)
  const results = await Promise.all(updatePromises);

  // Calculate summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  const durationMs = Date.now() - startTime;

  return {
    results,
    summary: {
      total: input.issue_ids.length,
      succeeded,
      failed,
    },
    duration_ms: durationMs,
  };
}
