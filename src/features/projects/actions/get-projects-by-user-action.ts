"use server";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import type { Project } from "@/features/projects/types";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function getProjectsByUserAction(
  userId: string
): Promise<Project[]> {
  const supabase = await createRequestSupabaseServerClient();
  const repository = new SupabaseProjectsRepository(supabase);

  return repository.listUserProjects(userId);
}
