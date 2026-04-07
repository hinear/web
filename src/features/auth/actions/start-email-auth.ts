"use server";

import { redirect } from "next/navigation";

import {
  readEmail,
  readNextPath,
  readReason,
} from "@/features/auth/lib/form-data";
import { buildAuthStatusPath } from "@/features/auth/lib/next-path";
import { getRequestOrigin } from "@/lib/request-origin";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function startEmailAuthAction(formData: FormData) {
  const email = readEmail(formData);
  const next = readNextPath(formData);
  const reason = readReason(formData);

  if (!email) {
    return redirect(
      buildAuthStatusPath({ email, error: "Email is required.", next, reason })
    );
  }

  const [origin, supabase] = await Promise.all([
    getRequestOrigin(),
    createRequestSupabaseServerClient(),
  ]);

  const redirectTo = new URL("/auth/confirm", origin);
  redirectTo.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return redirect(
      buildAuthStatusPath({
        email,
        error: error.message,
        next,
        reason,
      })
    );
  }

  return redirect(buildAuthStatusPath({ email, next, reason, sent: true }));
}
