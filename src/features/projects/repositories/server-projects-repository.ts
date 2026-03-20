import "server-only";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function getServerProjectsRepository() {
  return new SupabaseProjectsRepository(
    await createRequestSupabaseServerClient()
  );
}
