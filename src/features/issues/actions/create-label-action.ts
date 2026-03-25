"use server";

import { redirect } from "next/navigation";
import { SupabaseLabelsRepository } from "@/features/issues/repositories/supabase-labels-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function createLabelAction(input: {
  projectId: string;
  name: string;
}) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseLabelsRepository(supabase);

  try {
    const label = await repository.createLabel({
      ...input,
      createdBy: userId,
    });

    return {
      success: true,
      label,
    };
  } catch (error) {
    console.error("Failed to create label:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to create label";

    // 중복 라벨 에러 처리
    if (
      errorMessage.includes("duplicate key") &&
      errorMessage.includes("labels_project_id_name_key")
    ) {
      return {
        success: false,
        error: `A label with this name already exists`,
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
