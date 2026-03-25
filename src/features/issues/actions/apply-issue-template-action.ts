"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SupabaseIssueTemplatesRepository } from "@/features/issues/repositories/supabase-issue-templates-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function applyIssueTemplateAction(
  templateId: string,
  title: string
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
    const templateData = await repository.applyTemplate(templateId, title);

    return {
      success: true,
      ...templateData,
    };
  } catch (error) {
    console.error("Failed to apply issue template:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to apply issue template",
    };
  }
}
