import type { IssuePriority, IssueStatus } from "../types";

export interface IssueFilter {
  statuses?: IssueStatus[];
  priorities?: IssuePriority[];
  assigneeIds?: string[];
  labelIds?: string[];
  searchQuery?: string;
  dueBefore?: string; // ISO date string
  dueAfter?: string; // ISO date string
  createdAfter?: string; // ISO date string
  createdBefore?: string; // ISO date string
}

export interface IssueFilterOptions {
  operator?: "AND" | "OR";
  limit?: number;
  offset?: number;
}

/**
 * Supabase 쿼리를 위한 필터 빌더
 */
export function buildIssueFilterExpression(
  filter: IssueFilter,
  options: IssueFilterOptions = {}
) {
  const { operator = "AND" } = options;
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  // 상태 필터
  if (filter.statuses && filter.statuses.length > 0) {
    const statusKey = "status";
    conditions.push(`status.in.(${statusKey})`);
    params[statusKey] = `(${filter.statuses.join(",")})`;
  }

  // 우선순위 필터
  if (filter.priorities && filter.priorities.length > 0) {
    const priorityKey = "priority";
    conditions.push(`priority.in.(${priorityKey})`);
    params[priorityKey] = `(${filter.priorities.join(",")})`;
  }

  // 담당자 필터
  if (filter.assigneeIds && filter.assigneeIds.length > 0) {
    const assigneeKey = "assignee_id";
    conditions.push(`assignee_id.in.(${assigneeKey})`);
    params[assigneeKey] = `(${filter.assigneeIds.join(",")})`;
  }

  // 검색어 필터 (제목 또는 설명)
  if (filter.searchQuery && filter.searchQuery.trim()) {
    const searchKey = "search";
    conditions.push(
      `or(title.ilike.${searchKey},description.ilike.${searchKey})`
    );
    params[searchKey] = `%${filter.searchQuery.trim()}%`;
  }

  // 마감일 범위 필터
  if (filter.dueBefore) {
    conditions.push(`due_date.lte.due_before`);
    params.due_before = filter.dueBefore;
  }

  if (filter.dueAfter) {
    conditions.push(`due_date.gte.due_after`);
    params.due_after = filter.dueAfter;
  }

  // 생성일 범위 필터
  if (filter.createdAfter) {
    conditions.push(`created_at.gte.created_after`);
    params.created_after = filter.createdAfter;
  }

  if (filter.createdBefore) {
    conditions.push(`created_at.lte.created_before`);
    params.created_before = filter.createdBefore;
  }

  // 라벨 필터 (별도 테이블 조인 필요)
  // 이건 repository 레벨에서 처리

  return {
    conditions,
    params,
    operator,
  };
}

/**
 * 필터 객체를 URL 쿼리 파라미터로 변환
 */
export function filterToQueryParams(
  filter: IssueFilter
): Record<string, string> {
  const params: Record<string, string> = {};

  if (filter.statuses?.length) {
    params.statuses = filter.statuses.join(",");
  }
  if (filter.priorities?.length) {
    params.priorities = filter.priorities.join(",");
  }
  if (filter.assigneeIds?.length) {
    params.assigneeIds = filter.assigneeIds.join(",");
  }
  if (filter.labelIds?.length) {
    params.labelIds = filter.labelIds.join(",");
  }
  if (filter.searchQuery) {
    params.search = filter.searchQuery;
  }
  if (filter.dueBefore) {
    params.dueBefore = filter.dueBefore;
  }
  if (filter.dueAfter) {
    params.dueAfter = filter.dueAfter;
  }
  if (filter.createdAfter) {
    params.createdAfter = filter.createdAfter;
  }
  if (filter.createdBefore) {
    params.createdBefore = filter.createdBefore;
  }

  return params;
}

/**
 * URL 쿼리 파라미터를 필터 객체로 변환
 */
export function queryToFilter(
  params: Record<string, string | string[]>
): IssueFilter {
  const filter: IssueFilter = {};

  if (params.statuses) {
    filter.statuses = Array.isArray(params.statuses)
      ? (params.statuses as IssueStatus[])
      : ((params.statuses as string).split(",") as IssueStatus[]);
  }

  if (params.priorities) {
    filter.priorities = Array.isArray(params.priorities)
      ? (params.priorities as IssuePriority[])
      : ((params.priorities as string).split(",") as IssuePriority[]);
  }

  if (params.assigneeIds) {
    filter.assigneeIds = Array.isArray(params.assigneeIds)
      ? (params.assigneeIds as string[])
      : (params.assigneeIds as string).split(",");
  }

  if (params.labelIds) {
    filter.labelIds = Array.isArray(params.labelIds)
      ? (params.labelIds as string[])
      : (params.labelIds as string).split(",");
  }

  if (params.search) {
    filter.searchQuery = params.search as string;
  }

  if (params.dueBefore) {
    filter.dueBefore = params.dueBefore as string;
  }

  if (params.dueAfter) {
    filter.dueAfter = params.dueAfter as string;
  }

  if (params.createdAfter) {
    filter.createdAfter = params.createdAfter as string;
  }

  if (params.createdBefore) {
    filter.createdBefore = params.createdBefore as string;
  }

  return filter;
}
