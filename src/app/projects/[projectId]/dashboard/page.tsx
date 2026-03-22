import { ProjectDashboardScreen } from "@/features/projects/components/project-dashboard-screen";
import { loadProjectWorkspace } from "@/features/projects/lib/load-project-workspace";

interface ProjectDashboardPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectDashboardPage({
  params,
}: ProjectDashboardPageProps) {
  const { projectId } = await params;
  const { accessibleProjects, issues, project, summary } =
    await loadProjectWorkspace(projectId, `/projects/${projectId}/dashboard`);

  return (
    <ProjectDashboardScreen
      issues={issues}
      project={project}
      projects={accessibleProjects}
      summary={summary}
    />
  );
}
