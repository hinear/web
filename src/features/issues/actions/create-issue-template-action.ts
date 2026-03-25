"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SupabaseIssueTemplatesRepository } from "@/features/issues/repositories/supabase-issue-templates-repository";
import type { CreateIssueTemplateInput } from "@/features/issues/types/templates";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function createIssueTemplateAction(
  input: Omit<CreateIssueTemplateInput, "createdBy">
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
    const template = await repository.createTemplate({
      ...input,
      createdBy: userId,
    });

    return {
      success: true,
      template,
    };
  } catch (error) {
    console.error("Failed to create issue template:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create issue template",
    };
  }
}
