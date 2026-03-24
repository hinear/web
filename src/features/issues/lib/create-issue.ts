import type { CreateIssueInput } from "@/features/issues/contracts";
import { parseLabelInput } from "@/features/issues/lib/labels";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  type Issue,
} from "@/features/issues/types";

function assertNonEmptyValue(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
}

function assertIssueStatus(value: string | undefined): Issue["status"] {
  if (!value) {
    return "Triage";
  }

  if ((ISSUE_STATUSES as readonly string[]).includes(value)) {
    return value as Issue["status"];
  }

  throw new Error("Issue status is invalid.");
}

function assertIssuePriority(value: string | undefined): Issue["priority"] {
  if (!value) {
    return "No Priority";
  }

  if ((ISSUE_PRIORITIES as readonly string[]).includes(value)) {
    return value as Issue["priority"];
  }

  throw new Error("Issue priority is invalid.");
}

export function createIssueDraft(input: CreateIssueInput): CreateIssueInput {
  return {
    assigneeId: input.assigneeId ?? null,
    createdBy: assertNonEmptyValue(input.createdBy, "Issue creator"),
    description: input.description?.trim() ?? "",
    dueDate: input.dueDate ?? null,
    labels: parseLabelInput(input.labels?.join(", ")),
    priority: assertIssuePriority(input.priority),
    projectId: assertNonEmptyValue(input.projectId, "Project id"),
    status: assertIssueStatus(input.status),
    title: assertNonEmptyValue(input.title, "Issue title"),
  };
}

export function isIssueCreationReady(
  issue: Pick<Issue, "status" | "priority">
): boolean {
  return issue.status === "Triage" && issue.priority === "No Priority";
}
