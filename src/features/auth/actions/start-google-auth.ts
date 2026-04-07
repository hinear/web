"use server";

import { redirect } from "next/navigation";

import { readNextPath, readReason } from "@/features/auth/lib/form-data";
import { buildAuthStatusPath } from "@/features/auth/lib/next-path";
import { getRequestOrigin } from "@/lib/request-origin";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function startGoogleAuthAction(formData: FormData) {
  const next = readNextPath(formData);
  const reason = readReason(formData);

  const [origin, supabase] = await Promise.all([
    getRequestOrigin(),
    createRequestSupabaseServerClient(),
  ]);

  const redirectTo = new URL("/auth/confirm", origin);
  redirectTo.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: redirectTo.toString(),
    },
    provider: "google",
  });

  if (error || !data.url) {
    return redirect(
      buildAuthStatusPath({
        email: "",
        error: "Google login could not be started.",
        next,
        reason,
      })
    );
  }

  return redirect(data.url);
}
