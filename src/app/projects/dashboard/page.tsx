import { redirect } from "next/navigation";

import { getResolvedProjectDashboardPath } from "@/features/auth/lib/default-post-auth-path";

export default async function ProjectsDashboardPage() {
  redirect(await getResolvedProjectDashboardPath());
}
