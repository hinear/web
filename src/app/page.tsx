import { redirect } from "next/navigation";

import { getDefaultPostAuthPath } from "@/features/auth/lib/default-post-auth-path";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export default async function Home() {
  if (await getAuthenticatedActorIdOrNull()) {
    redirect(await getDefaultPostAuthPath());
  }

  redirect("/auth");
}
