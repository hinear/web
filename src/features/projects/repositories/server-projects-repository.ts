import "server-only";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";

export function getServerProjectsRepository() {
  return new SupabaseProjectsRepository();
}
