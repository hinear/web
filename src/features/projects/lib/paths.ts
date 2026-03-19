export function getProjectPath(projectId: string): string {
  return `/projects/${projectId}`;
}

export function getIssuePath(projectId: string, issueId: string): string {
  return `/projects/${projectId}/issues/${issueId}`;
}
