import { redirect } from "next/navigation";

import { buildAuthPath } from "@/features/auth/lib/next-path";
import { createProjectAction } from "@/features/projects/actions/create-project-action";
import { ProjectCreateScreen } from "@/features/projects/components/project-create-screen";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

interface NewProjectPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  if (!(await getAuthenticatedActorIdOrNull())) {
    redirect(buildAuthPath("/projects/new"));
  }

  const params = await searchParams;

  return (
    <ProjectCreateScreen
      action={createProjectAction}
      errorMessage={params.error}
    />
  );
}
