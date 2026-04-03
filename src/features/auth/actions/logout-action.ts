"use server";

import { redirect } from "next/navigation";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Server action to sign out the current user
 */
export async function signOutAction() {
  const supabase = await createRequestSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
