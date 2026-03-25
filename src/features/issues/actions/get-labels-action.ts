"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SupabaseLabelsRepository } from "@/features/issues/repositories/supabase-labels-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function getLabelsAction(projectId: string) {
  const userId = await getAuthenticatedActorIdOrNull();

  if (!userId) {
    redirect("/auth/signin");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const repository = new SupabaseLabelsRepository(supabase);

  try {
    const labels = await repository.getLabelsByProject(projectId);

    return {
      success: true,
      labels,
    };
  } catch (error) {
    console.error("Failed to get labels:", error);

    return {
      success: false,
      labels: [],
      error: error instanceof Error ? error.message : "Failed to get labels",
    };
  }
}
