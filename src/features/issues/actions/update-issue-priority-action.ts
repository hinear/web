"use server";

import { revalidatePath } from "next/cache";
import {
  getMutationErrorMessage,
  getMutationErrorStatus,
  inferMutationErrorCode,
} from "@/features/issues/lib/mutation-error-messages";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import type { IssuePriority } from "@/features/issues/types";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export interface UpdateIssuePriorityInput {
  issueId: string;
  priority: IssuePriority;
  version: number;
}

export async function updateIssuePriorityAction(
  input: UpdateIssuePriorityInput
) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return {
      success: false,
      error: "Your session expired. Sign in again and retry.",
    };
  }

  try {
    const repository = await getServerIssuesRepository();
    const issue = await repository.getIssueById(input.issueId);

    if (!issue) {
      return {
        success: false,
        error: "Issue not found",
      };
    }

    const updatedIssue = await repository.updateIssue(input.issueId, {
      priority: input.priority,
      updatedBy: actorId,
      version: input.version,
    });

    // Revalidate the project page to show updated issue
    revalidatePath(`/projects/${updatedIssue.projectId}`);

    return {
      success: true,
      issue: updatedIssue,
    };
  } catch (error) {
    const code = inferMutationErrorCode(error);
    return {
      success: false,
      error: getMutationErrorMessage({
        actionLabel: "issue",
        code,
        fallbackMessage: error instanceof Error ? error.message : null,
        status: getMutationErrorStatus(code),
      }),
    };
  }
}
