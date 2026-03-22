"use server";

import { redirect } from "next/navigation";

import {
  type AuthRedirectReason,
  buildAuthPath,
  normalizeNextPath,
} from "@/features/auth/lib/next-path";
import { getRequestOrigin } from "@/lib/request-origin";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim();
}

function readNextPath(formData: FormData): string {
  return normalizeNextPath(formData.get("next"), "/");
}

function readReason(formData: FormData): AuthRedirectReason | undefined {
  return (formData.get("reason") as AuthRedirectReason | null) ?? undefined;
}

function buildAuthStatusPath({
  email,
  error,
  next,
  reason,
  sent,
}: {
  email: string;
  error?: string;
  next: string;
  reason?: AuthRedirectReason;
  sent?: boolean;
}): string {
  const searchParams = new URLSearchParams();

  searchParams.set("next", next);

  if (reason) {
    searchParams.set("reason", reason);
  }

  if (email) {
    searchParams.set("email", email);
  }

  if (sent) {
    searchParams.set("sent", "1");
  }

  if (error) {
    searchParams.set("error", error);
  }

  return `/auth?${searchParams.toString()}`;
}

export async function startEmailAuthAction(formData: FormData) {
  const email = readEmail(formData);
  const next = readNextPath(formData);
  const reason = readReason(formData);

  if (!email) {
    return redirect(
      buildAuthStatusPath({ email, error: "Email is required.", next, reason })
    );
  }

  const redirectTo = new URL("/auth/confirm", await getRequestOrigin());

  redirectTo.searchParams.set("next", next);

  const supabase = createServerSupabaseClient();
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

export async function requireAuthRedirect(
  nextPath: string,
  reason: AuthRedirectReason = "auth_required"
): Promise<never> {
  return redirect(buildAuthPath(nextPath, reason));
}
