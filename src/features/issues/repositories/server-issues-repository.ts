import "server-only";

import { SupabaseIssuesRepository } from "@/features/issues/repositories/supabase-issues-repository";

export function getServerIssuesRepository() {
  return new SupabaseIssuesRepository();
}
