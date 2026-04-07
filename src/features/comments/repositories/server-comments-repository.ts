import "server-only";

import { cache } from "react";
import { SupabaseCommentsRepository } from "@/features/comments/repositories/SupabaseCommentsRepository";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export const getServerCommentsRepository = cache(
  async () =>
    new SupabaseCommentsRepository(await createRequestSupabaseServerClient())
);
