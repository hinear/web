const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]+$/;

export function normalizeProjectKey(projectKey: string): string {
  return projectKey.trim().toUpperCase();
}

export function isValidProjectKey(projectKey: string): boolean {
  return PROJECT_KEY_PATTERN.test(normalizeProjectKey(projectKey));
}

export function assertProjectKey(projectKey: string): string {
  const normalizedProjectKey = normalizeProjectKey(projectKey);

  if (!PROJECT_KEY_PATTERN.test(normalizedProjectKey)) {
    throw new Error("Project key must contain only uppercase letters and numbers.");
  }

  return normalizedProjectKey;
}
