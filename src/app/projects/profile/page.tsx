import { redirect } from "next/navigation";

import { signOutAction } from "@/features/auth/actions/logout";
import { ProfileSettingsScreen } from "@/features/auth/components/profile-settings-screen";
import { buildAuthPath } from "@/features/auth/lib/next-path";
import { getAuthenticatedUserOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

function resolveDisplayName(
  profile: { display_name: string | null } | null,
  user: {
    email?: string | null;
    id: string;
    user_metadata?: Record<string, unknown> | null;
  }
) {
  const profileName = profile?.display_name?.trim();
  if (profileName) {
    return profileName;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  if (fullName) {
    return fullName;
  }

  const name =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name.trim()
      : "";
  if (name) {
    return name;
  }

  return user.email?.trim() || user.id;
}

export default async function ProfileSettingsPage() {
  const user = await getAuthenticatedUserOrNull();

  if (!user) {
    redirect(buildAuthPath("/projects/profile"));
  }

  const supabase = await createRequestSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="app-shell min-h-[100dvh]">
      <ProfileSettingsScreen
        accountId={user.id}
        displayName={resolveDisplayName(profile, user)}
        email={user.email?.trim() || "No email available"}
        logoutAction={signOutAction}
      />
    </div>
  );
}
