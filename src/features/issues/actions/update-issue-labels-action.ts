"use server";

import { redirect } from "next/navigation";
import { SupabaseLabelsRepository } from "@/features/issues/repositories/supabase-labels-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function updateIssueLabelsAction(input: {
  issueId: string;
  projectId: string;
  labelIds: string[];
}) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseLabelsRepository(supabase);

  try {
    await repository.updateIssueLabels(
      input.issueId,
      input.projectId,
      input.labelIds
    );

    // 업데이트된 이슈 정보를 다시 가져와서 반환
    const { data: issue } = await supabase
      .from("issues")
      .select(`
        *,
        labels (
          label_id,
          labels (
            id,
            name,
            color
          )
        )
      `)
      .eq("id", input.issueId)
      .single();

    return {
      success: true,
      issue,
    };
  } catch (error) {
    console.error("Failed to update issue labels:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update issue labels",
    };
  }
}
