export function getProjectPath(projectId: string): string {
  return `/projects/${projectId}`;
}

export function getProjectDashboardPath(projectId: string): string {
  return `/projects/${projectId}/dashboard`;
}

export function getProjectSettingsPath(projectId: string): string {
  return `/projects/${projectId}/settings`;
}

export function getProjectIssueCreatePath(projectId: string): string {
  return `/projects/${projectId}/issues/new`;
}

export function getIssuePath(projectId: string, issueId: string): string {
  return `/projects/${projectId}/issues/${issueId}`;
}
