import "server-only";

import type { AuthUser as User } from "@supabase/supabase-js";
import { cache } from "react";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthenticationRequiredError";
  }
}

// OAuth 콜백 전용 프로필 동기화 - 일반 API 요청에서는 호출되지 않음
export async function syncAuthenticatedProfile(
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

export const getAuthenticatedUserOrNull = cache(
  async (): Promise<User | null> => {
    const supabase = await createRequestSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  }
);

export const getAuthenticatedActorIdOrNull = cache(
  async (): Promise<string | null> => {
    const user = await getAuthenticatedUserOrNull();
    return user?.id ?? null;
  }
);

export async function requireAuthenticatedActorId(): Promise<string> {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    throw new AuthenticationRequiredError();
  }

  return actorId;
}
