import type { ProjectsRepository } from "@/features/projects/contracts";
import { createProjectWithOwner } from "@/features/projects/lib/create-project";
import { getProjectPath } from "@/features/projects/lib/paths";
import type { ProjectType } from "@/features/projects/types";

export interface CreateProjectFlowInput {
  actorId: string;
  key: string;
  name: string;
  type: ProjectType;
}

export async function createProjectFlow(
  repository: ProjectsRepository,
  input: CreateProjectFlowInput
): Promise<string> {
  const project = await createProjectWithOwner(repository, {
    key: input.key,
    name: input.name,
    type: input.type,
    createdBy: input.actorId,
  });

  return getProjectPath(project.id);
}
