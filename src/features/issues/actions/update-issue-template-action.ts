"use server";

import { redirect } from "next/navigation";
import { SupabaseIssueTemplatesRepository } from "@/features/issues/repositories/supabase-issue-templates-repository";
import type { UpdateIssueTemplateInput } from "@/features/issues/types/templates";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function updateIssueTemplateAction(
  templateId: string,
  input: UpdateIssueTemplateInput
) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = await createRequestSupabaseServerClient();

  const repository = new SupabaseIssueTemplatesRepository(supabase);

  try {
    const template = await repository.updateTemplate(templateId, input);

    return {
      success: true,
      template,
    };
  } catch (error) {
    console.error("Failed to update issue template:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update issue template",
    };
  }
}
