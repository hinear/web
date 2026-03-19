import type { CreateIssueInput } from "@/features/issues/contracts";
import type { Issue } from "@/features/issues/types";

function assertNonEmptyValue(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

export function createIssueDraft(input: CreateIssueInput): CreateIssueInput {
  return {
    ...input,
    projectId: assertNonEmptyValue(input.projectId, "Project id"),
    title: assertNonEmptyValue(input.title, "Issue title"),
    description: input.description?.trim() ?? "",
    assigneeId: input.assigneeId ?? null,
    createdBy: assertNonEmptyValue(input.createdBy, "Issue creator"),
  };
}

export function isIssueCreationReady(issue: Pick<Issue, "status" | "priority">): boolean {
  return issue.status === "Triage" && issue.priority === "No Priority";
}
