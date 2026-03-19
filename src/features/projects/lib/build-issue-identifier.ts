function assertProjectKey(projectKey: string): string {
  const normalizedKey = projectKey.trim().toUpperCase();

  if (!/^[A-Z][A-Z0-9]+$/.test(normalizedKey)) {
    throw new Error("Project key must contain only uppercase letters and numbers.");
  }

  return normalizedKey;
}

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
