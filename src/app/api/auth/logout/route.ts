import { type NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/request-origin";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Logout API - Signs out user and redirects to home
 */
export async function GET(_request: NextRequest) {
  const supabase = await createRequestSupabaseServerClient();

  await supabase.auth.signOut();

  const origin = await getRequestOrigin();
  return NextResponse.redirect(new URL("/auth", origin));
}
