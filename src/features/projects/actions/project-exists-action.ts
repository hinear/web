"use server";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function projectExistsAction(
  projectKey: string
): Promise<boolean> {
  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseProjectsRepository(supabase);

  return repository.projectExists(projectKey);
}
