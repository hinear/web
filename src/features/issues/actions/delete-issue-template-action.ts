"use server";

import { redirect } from "next/navigation";
import { SupabaseIssueTemplatesRepository } from "@/features/issues/repositories/supabase-issue-templates-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function deleteIssueTemplateAction(templateId: string) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = await createRequestSupabaseServerClient();

  const repository = new SupabaseIssueTemplatesRepository(supabase);

  try {
    await repository.deleteTemplate(templateId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete issue template:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete issue template",
    };
  }
}
