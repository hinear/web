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

export function getIssuePath(
  projectId: string,
  issueId: string,
  options?: { view?: "full" }
): string {
  // Full page: separate route
  if (options?.view === "full") {
    return `/projects/${projectId}/issues/${issueId}?view=full`;
  }
  // Drawer (default): query param on project page
  return `/projects/${projectId}?issueId=${issueId}`;
}
