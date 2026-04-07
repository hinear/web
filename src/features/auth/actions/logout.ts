"use server";

import { redirect } from "next/navigation";

import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function signOutAction() {
  const supabase = await createRequestSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("signOutAction failed:", error.message);
  }

  redirect("/auth");
}
