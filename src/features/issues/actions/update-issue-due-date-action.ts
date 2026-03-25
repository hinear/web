"use server";

import { revalidatePath } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getIssueUpdateErrorMessage } from "@/features/issues/lib/issue-update-error-message";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";

export interface UpdateIssueDueDateInput {
  issueId: string;
  dueDate: string | null;
  version: number;
}

export async function updateIssueDueDateAction(input: UpdateIssueDueDateInput) {
  const actorId = await requireAuthRedirect();

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
      dueDate: input.dueDate,
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
    return {
      success: false,
      error: getIssueUpdateErrorMessage(error),
    };
  }
}
