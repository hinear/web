"use server";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import type { Issue } from "@/features/issues/types";

export interface SearchIssuesInput {
  projectId: string;
  query: string;
}

export async function searchIssuesAction(input: SearchIssuesInput) {
  const actorId = await requireAuthRedirect();

  try {
    const repository = await getServerIssuesRepository();
    const issues = await repository.searchIssues({
      projectId: input.projectId,
      query: input.query,
    });

    return {
      success: true,
      issues,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search issues",
      issues: [],
    };
  }
}
