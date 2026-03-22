import type {
  CreateProjectInput,
  ProjectsRepository,
} from "@/features/projects/contracts";
import { assertProjectKey } from "@/features/projects/lib/project-key";
import type { ProjectMember } from "@/features/projects/types";

function assertNonEmptyValue(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

export function createProjectDraft(
  input: CreateProjectInput
): CreateProjectInput {
  return {
    ...input,
    key: assertProjectKey(input.key),
    name: assertNonEmptyValue(input.name, "Project name"),
    createdBy: assertNonEmptyValue(input.createdBy, "Project creator"),
  };
}

export function createInitialProjectMembership(
  projectId: string,
  userId: string
): ProjectMember {
  return {
    projectId: assertNonEmptyValue(projectId, "Project id"),
    userId: assertNonEmptyValue(userId, "User id"),
    role: "owner",
    createdAt: new Date().toISOString(),
  };
}

export async function createProjectWithOwner(
  repository: ProjectsRepository,
  input: CreateProjectInput
) {
  const draft = createProjectDraft(input);
  return repository.createProject(draft);
}
