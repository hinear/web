/**
 * 이슈보드 페이지 경로를 반환합니다.
 * @param projectId 프로젝트 ID
 * @returns 이슈보드 경로 (예: /projects/{projectId})
 */
export function getProjectPath(projectId: string): string {
  return `/projects/${projectId}`;
}

export function getProjectFilteredPath(
  projectId: string,
  filters: {
    assigneeIds?: string[];
    labelIds?: string[];
    priorities?: string[];
    search?: string;
    statuses?: string[];
  }
): string {
  const searchParams = new URLSearchParams();

  if (filters.search?.trim()) {
    searchParams.set("search", filters.search.trim());
  }

  if (filters.statuses?.length) {
    searchParams.set("statuses", filters.statuses.join(","));
  }

  if (filters.priorities?.length) {
    searchParams.set("priorities", filters.priorities.join(","));
  }

  if (filters.assigneeIds?.length) {
    searchParams.set("assigneeIds", filters.assigneeIds.join(","));
  }

  if (filters.labelIds?.length) {
    searchParams.set("labelIds", filters.labelIds.join(","));
  }

  const query = searchParams.toString();

  return query
    ? `${getProjectPath(projectId)}?${query}`
    : getProjectPath(projectId);
}

/**
 * 오버뷰 페이지 경로를 반환합니다.
 * @param projectId 프로젝트 ID
 * @returns 오버뷰 경로 (예: /projects/{projectId}/overview)
 */
export function getProjectOverviewPath(projectId: string): string {
  return `/projects/${projectId}/overview`;
}

export function getProjectSettingsPath(projectId: string): string {
  return `/projects/${projectId}/settings`;
}

export function getProfileSettingsPath(): string {
  return "/projects/profile";
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
