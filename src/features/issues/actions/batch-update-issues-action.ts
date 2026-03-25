"use server";

import { revalidatePath } from "next/cache";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import type { IssuePriority, IssueStatus } from "@/features/issues/types";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export interface BatchIssueUpdate {
  issueId: string;
  version?: number;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
}

export interface BatchUpdateIssuesInput {
  projectId: string;
  updates: BatchIssueUpdate[];
}

export interface BatchUpdateIssuesResult {
  success: boolean;
  updated: Array<{ issueId: string; success: boolean; error?: string }>;
  errors: string[];
}

export async function batchUpdateIssuesAction(
  input: BatchUpdateIssuesInput
): Promise<BatchUpdateIssuesResult> {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    throw new Error("Authentication required");
  }

  const repository = await getServerIssuesRepository();

  const results: Array<{ issueId: string; success: boolean; error?: string }> =
    [];
  const errors: string[] = [];

  for (const update of input.updates) {
    try {
      const issue = await repository.getIssueById(update.issueId);

      if (!issue) {
        results.push({
          issueId: update.issueId,
          success: false,
          error: "Issue not found",
        });
        errors.push(`Issue ${update.issueId} not found`);
        continue;
      }

      await repository.updateIssue(update.issueId, {
        status: update.status,
        priority: update.priority,
        assigneeId: update.assigneeId,
        updatedBy: actorId,
        version: issue.version,
      });

      results.push({
        issueId: update.issueId,
        success: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.push({
        issueId: update.issueId,
        success: false,
        error: errorMessage,
      });
      errors.push(`Issue ${update.issueId}: ${errorMessage}`);
    }
  }

  // Revalidate the project page to show updated issues
  revalidatePath(`/projects/${input.projectId}`);

  return {
    success: errors.length === 0,
    updated: results,
    errors,
  };
}
