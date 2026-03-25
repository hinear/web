"use server";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { createClient } from "@/lib/supabase/server-client";

export async function checkProjectAccessAction(
  projectId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const repository = new SupabaseProjectsRepository(supabase);

  return repository.checkProjectAccess(projectId, userId);
}
