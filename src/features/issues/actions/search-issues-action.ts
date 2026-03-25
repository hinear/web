"use server";

import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export interface SearchIssuesInput {
  projectId: string;
  query: string;
}

export async function searchIssuesAction(input: SearchIssuesInput) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return {
      success: false,
      error: "Authentication required",
      issues: [],
    };
  }

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
