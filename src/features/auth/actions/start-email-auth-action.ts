"use server";

import { redirect } from "next/navigation";

import {
  type AuthRedirectReason,
  buildAuthPath,
  normalizeNextPath,
} from "@/features/auth/lib/next-path";
import { getRequestOrigin } from "@/lib/request-origin";
import {
  createRequestSupabaseServerClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server-client";

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

export async function startGoogleAuthAction(formData: FormData) {
  const next = readNextPath(formData);
  const reason = readReason(formData);
  const redirectTo = new URL("/auth/confirm", await getRequestOrigin());
  redirectTo.searchParams.set("next", next);

  // OAuth starts with PKCE state that must be persisted on the request/response
  // so the confirm callback can exchange the returned code for a session.
  const supabase = await createRequestSupabaseServerClient();
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

export async function requireAuthRedirect(
  nextPath: string,
  reason: AuthRedirectReason = "auth_required"
): Promise<never> {
  return redirect(buildAuthPath(nextPath, reason));
}

function readProjectId(formData: FormData): string {
  return String(formData.get("projectId") ?? "");
}

function appendGitHubRepoSelectionFlag(next: string): string {
  const url = new URL(next, "http://localhost");
  url.searchParams.set("github", "select-repo");

  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}

export async function startGitHubAuthAction(formData: FormData) {
  const next = readNextPath(formData);
  const reason = readReason(formData);
  const projectId = readProjectId(formData);

  if (!projectId) {
    return redirect(
      buildAuthStatusPath({
        email: "",
        error: "Project ID is required for GitHub integration.",
        next,
        reason,
      })
    );
  }

  // GitHub App OAuth Flow 사용 (앱 로그인과 독립적)
  const origin = await getRequestOrigin();
  const githubAuthUrl = new URL("/api/github/auth", origin);
  githubAuthUrl.searchParams.set("projectId", projectId);

  return redirect(githubAuthUrl.toString());
}
