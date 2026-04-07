import { Suspense } from "react";

import { loadProjectShell } from "@/features/projects/lib/load-project-workspace";
import { OverviewContentSkeleton } from "@/features/projects/overview/components/overview-content-skeleton";
import { ProjectOverviewContent } from "@/features/projects/overview/components/project-overview-content";
import { ProjectOverviewShell } from "@/features/projects/overview/components/project-overview-shell";

interface ProjectOverviewPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectOverviewPage({
  params,
}: ProjectOverviewPageProps) {
  const { projectId } = await params;
  const { accessibleProjects, project } = await loadProjectShell(projectId);

  return (
    <ProjectOverviewShell project={project} projects={accessibleProjects}>
      <Suspense fallback={<OverviewContentSkeleton />}>
        <ProjectOverviewContent projectId={projectId} />
      </Suspense>
    </ProjectOverviewShell>
  );
}
