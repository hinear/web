import "server-only";

import type { User } from "@supabase/supabase-js";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthenticationRequiredError";
  }
}

async function syncAuthenticatedProfile(
  supabase: AppSupabaseServerClient,
  user: User
) {
  const email = user.email?.trim();

  if (!email) {
    return;
  }

  const displayName =
    user.user_metadata?.full_name?.trim() ||
    user.user_metadata?.name?.trim() ||
    null;
  const avatarUrl = user.user_metadata?.avatar_url?.trim() || null;

  await supabase.from("profiles").upsert(
    {
      avatar_url: avatarUrl,
      display_name: displayName,
      email,
      email_normalized: email.toLowerCase(),
      id: user.id,
    },
    {
      onConflict: "id",
    }
  );
}

export async function getAuthenticatedUserOrNull(): Promise<User | null> {
  const supabase = await createRequestSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  await syncAuthenticatedProfile(supabase, user);

  return user;
}

export async function getAuthenticatedActorIdOrNull(): Promise<string | null> {
  const user = await getAuthenticatedUserOrNull();
  return user?.id ?? null;
}

export async function requireAuthenticatedActorId(): Promise<string> {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    throw new AuthenticationRequiredError();
  }

  return actorId;
}
