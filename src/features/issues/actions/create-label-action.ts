"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { SupabaseLabelsRepository } from "@/features/issues/repositories/supabase-labels-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function createLabelAction(input: {
  projectId: string;
  name: string;
}) {
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

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create label",
    };
  }
}
