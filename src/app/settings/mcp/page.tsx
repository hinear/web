import { redirect } from "next/navigation";

import { buildAuthPath } from "@/features/auth/lib/next-path";
import { McpTokenSettingsCard } from "@/features/mcp/components/mcp-token-settings-card";
import { getAuthenticatedUserOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function MCPSettingsPage() {
  const user = await getAuthenticatedUserOrNull();

  if (!user) {
    redirect(buildAuthPath("/settings/mcp"));
  }

  const supabase = await createRequestSupabaseServerClient();
  const { data } = await supabase
    .from("mcp_access_tokens")
    .select("id,name,created_at,last_used_at,expires_at,revoked_at")
    .order("created_at", { ascending: false });

  return (
    <div className="app-shell min-h-[100dvh]">
      <McpTokenSettingsCard
        appOrigin={
          process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() ||
          process.env.APP_ORIGIN?.trim() ||
          null
        }
        initialTokens={data ?? []}
      />
    </div>
  );
}
