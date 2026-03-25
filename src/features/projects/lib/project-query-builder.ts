/**
 * Project query builder utilities
 * Complex filtering utilities for projects
 */

import type { ProjectType } from "../types";

export interface ProjectFilters {
  type?: ProjectType;
  search?: string;
  memberUserId?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectSortOptions {
  field?: "createdAt" | "updatedAt" | "name";
  order?: "asc" | "desc";
}

/**
 * Build Supabase query from filters
 */
export function buildProjectQuery(filters: ProjectFilters): {
  select: string;
  eq: Record<string, string>;
  ilike?: Record<string, string>;
  range?: [number, number];
  order?: { column: string; ascending: boolean };
} {
  const query: {
    select: string;
    eq: Record<string, string>;
    ilike?: Record<string, string>;
    range?: [number, number];
    order?: { column: string; ascending: boolean };
  } = {
    select: "*",
    eq: {},
  };

  // Filter by type
  if (filters.type) {
    query.eq.type = filters.type;
  }

  // Filter by member
  if (filters.memberUserId) {
    // This requires a join with project_members
    // Handled separately in repository
  }

  // Filter by creator
  if (filters.createdBy) {
    query.eq.created_by = filters.createdBy;
  }

  // Search query
  if (filters.search && filters.search.trim().length > 0) {
    query.ilike = {
      name: `%${filters.search.trim()}%`,
    };
  }

  // Pagination
  if (filters.limit !== undefined && filters.offset !== undefined) {
    query.range = [filters.offset, filters.offset + filters.limit - 1];
  }

  return query;
}

/**
 * Build order by clause
 */
export function buildOrderBy(sortOptions?: ProjectSortOptions): {
  column: string;
  ascending: boolean;
} {
  return {
    column: sortOptions?.field === "name" ? "name" : "created_at",
    ascending: sortOptions?.order === "asc",
  };
}

/**
 * Validate project filters
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateProjectFilters(
  filters: ProjectFilters
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (filters.limit !== undefined) {
    if (filters.limit < 1) {
      errors.push({
        field: "limit",
        message: "Limit은 1 이상이어야 합니다.",
      });
    }
    if (filters.limit > 100) {
      errors.push({
        field: "limit",
        message: "Limit은 최대 100까지 가능합니다.",
      });
    }
  }

  if (filters.offset !== undefined && filters.offset < 0) {
    errors.push({
      field: "offset",
      message: "Offset은 0 이상이어야 합니다.",
    });
  }

  if (filters.type && !["personal", "team"].includes(filters.type)) {
    errors.push({
      field: "type",
      message: "유효하지 않은 프로젝트 타입입니다.",
    });
  }

  return errors;
}

/**
 * Calculate pagination info
 */
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function calculatePagination(
  total: number,
  limit: number,
  offset: number
): PaginationInfo {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    limit,
    offset,
    currentPage,
    totalPages,
    hasNext: offset + limit < total,
    hasPrevious: offset > 0,
  };
}

/**
 * Build next page cursor
 */
export function buildNextPageCursor(
  currentPage: number,
  limit: number
): number {
  return currentPage * limit;
}

/**
 * Build previous page cursor
 */
export function buildPreviousPageCursor(
  currentPage: number,
  limit: number
): number {
  return Math.max(0, (currentPage - 2) * limit);
}
