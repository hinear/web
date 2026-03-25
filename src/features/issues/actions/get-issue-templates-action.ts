"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SupabaseIssueTemplatesRepository } from "@/features/issues/repositories/supabase-issue-templates-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function getIssueTemplatesAction(
  projectId: string,
  activeOnly = false
) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const repository = new SupabaseIssueTemplatesRepository(supabase);

  try {
    const templates = activeOnly
      ? await repository.getActiveTemplatesByProject(projectId)
      : await repository.getTemplatesByProject(projectId);

    return {
      success: true,
      templates,
    };
  } catch (error) {
    console.error("Failed to get issue templates:", error);

    return {
      success: false,
      templates: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to get issue templates",
    };
  }
}
