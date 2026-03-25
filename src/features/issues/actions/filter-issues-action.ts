"use server";

import { redirect } from "next/navigation";
import type { FilterIssuesInput } from "@/features/issues/contracts";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function filterIssuesAction(input: FilterIssuesInput) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const repository = await getServerIssuesRepository();

  try {
    const issues = await repository.filterIssues(input);

    return {
      success: true,
      issues,
      count: issues.length,
    };
  } catch (error) {
    console.error("Failed to filter issues:", error);

    return {
      success: false,
      issues: [],
      count: 0,
      error: error instanceof Error ? error.message : "Failed to filter issues",
    };
  }
}
