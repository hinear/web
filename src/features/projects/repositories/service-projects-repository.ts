import "server-only";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

export function getServiceProjectsRepository() {
  return new SupabaseProjectsRepository(createServiceRoleSupabaseClient());
}
