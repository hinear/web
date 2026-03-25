import "server-only";

import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Repository for project operations that need to work with invite tokens.
 *
 * Uses anon key with session context (not service-role) because:
 * - Invite token operations use SECURITY DEFINER functions that bypass RLS
 * - The token itself is the security mechanism (like password reset tokens)
 * - This is more secure than using service-role which bypasses ALL RLS policies
 */
export async function getServiceProjectsRepository() {
  return new SupabaseProjectsRepository(
    await createRequestSupabaseServerClient()
  );
}
