import { notFound } from "next/navigation";

import { createIssueAction } from "@/features/issues/actions/create-issue-action";
import { ProjectWorkspaceScreen } from "@/features/projects/components/project-workspace-screen";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const repository = getServerProjectsRepository();
  const project = await repository.getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <ProjectWorkspaceScreen
      action={createIssueAction.bind(null, project.id)}
      project={project}
    />
  );
}
