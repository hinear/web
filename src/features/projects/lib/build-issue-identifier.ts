import { assertProjectKey } from "@/features/projects/lib/project-key";

function assertSequence(sequence: number): number {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Issue sequence must be a positive integer.");
  }

  return sequence;
}

export function buildIssueIdentifier(projectKey: string, sequence: number): string {
  const safeProjectKey = assertProjectKey(projectKey);
  const safeSequence = assertSequence(sequence);

  return `${safeProjectKey}-${safeSequence}`;
}
