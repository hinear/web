"use client";

import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "@/specs/issue-detail.contract";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BoardFilterState {
  assigneeId: string;
  labelId: string;
  priority: string;
  search: string;
  status: string;
}

export interface UseBoardFiltersOptions {
  /** Issues returned from the data layer *before* local filter application. */
  issues: Issue[];
}

export interface UseBoardFiltersReturn {
  /** Current filter state (deferred search is trimmed). */
  filters: BoardFilterState;

  /** Issues after filtering (may be the same array when the data-layer handles it). */
  filteredIssues: Issue[];

  /** Number of currently active (non-empty) filters. */
  activeFilterCount: number;

  /** Whether the filter panel should be visible. */
  shouldShowFilters: boolean;

  /** The *immediate* search input value (not deferred). */
  searchInput: string;

  /** Labels extracted from the current issue set. */
  availableLabels: Array<{
    color: string;
    id: string;
    name: string;
  }>;

  /** Update an individual filter by its URL query key. */
  updateFilterQuery: (key: string, value: string) => void;

  /** Reset every filter to its empty/default value. */
  clearFilters: () => void;

  /** Set the raw search input string. */
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;

  /** Toggle the filter panel open state. */
  toggleFilterPanel: () => void;

  /** Whether the filter panel is currently open. */
  isFilterPanelOpen: boolean;

  /**
   * Build the issue-query parameters that should be sent to the data layer.
   * Callers should spread these into their useIssues / fetch call.
   */
  issueQueryParams: {
    assigneeIds: string[];
    labelIds: string[];
    priorities: IssuePriority[];
    searchQuery: string;
    statuses: IssueStatus[];
  };
}

// ---------------------------------------------------------------------------
// Pure helpers (extracted from KanbanBoardView)
// ---------------------------------------------------------------------------

function getSingleQueryValue(
  searchParams: ReturnType<typeof useSearchParams>,
  key: string
) {
  return searchParams.get(key)?.split(",")[0] ?? "";
}

function getBoardFilterState(
  searchParams: ReturnType<typeof useSearchParams>
): BoardFilterState {
  return {
    assigneeId: getSingleQueryValue(searchParams, "assigneeIds"),
    labelId: getSingleQueryValue(searchParams, "labelIds"),
    priority: getSingleQueryValue(searchParams, "priorities"),
    search: getSingleQueryValue(searchParams, "search"),
    status: getSingleQueryValue(searchParams, "statuses"),
  };
}

function setBoardFilterQuery(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
  filters: BoardFilterState
) {
  if (typeof window === "undefined") {
    return;
  }

  const nextParams = new URLSearchParams(searchParams.toString());
  const entries: Array<[keyof BoardFilterState, string]> = [
    ["search", filters.search.trim()],
    ["status", filters.status],
    ["priority", filters.priority],
    ["assigneeId", filters.assigneeId],
    ["labelId", filters.labelId],
  ];

  const queryKeyMap: Record<keyof BoardFilterState, string> = {
    assigneeId: "assigneeIds",
    labelId: "labelIds",
    priority: "priorities",
    search: "search",
    status: "statuses",
  };

  for (const [key, value] of entries) {
    if (value) {
      nextParams.set(queryKeyMap[key], value);
    } else {
      nextParams.delete(queryKeyMap[key]);
    }
  }

  const nextQuery = nextParams.toString();
  const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

  if (window.location.pathname + window.location.search === nextUrl) {
    return;
  }

  window.history.replaceState(null, "", nextUrl);
}

function getAvailableLabels(issues: Issue[]) {
  const labelsById = new Map<
    string,
    {
      color: string;
      id: string;
      name: string;
    }
  >();

  for (const issue of issues) {
    for (const label of issue.labels) {
      if (!labelsById.has(label.id)) {
        labelsById.set(label.id, label);
      }
    }
  }

  return [...labelsById.values()].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBoardFilters(
  options: UseBoardFiltersOptions
): UseBoardFiltersReturn {
  const { issues } = options;

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive initial values from URL so a shared link restores filters.
  const initialFilterState = React.useMemo(
    () => getBoardFilterState(searchParams),
    [searchParams]
  );

  // Individual filter state atoms.
  const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(
    initialFilterState.search
  );
  const [statusFilter, setStatusFilter] = React.useState(
    initialFilterState.status
  );
  const [priorityFilter, setPriorityFilter] = React.useState(
    initialFilterState.priority
  );
  const [assigneeFilter, setAssigneeFilter] = React.useState(
    initialFilterState.assigneeId
  );
  const [labelFilter, setLabelFilter] = React.useState(
    initialFilterState.labelId
  );

  // Deferred search avoids hammering the data layer on every keystroke.
  const deferredSearchInput = React.useDeferredValue(searchInput);

  // Computed filter state object (used for display + URL sync).
  const filters: BoardFilterState = React.useMemo(
    () => ({
      assigneeId: assigneeFilter,
      labelId: labelFilter,
      priority: priorityFilter,
      search: deferredSearchInput.trim(),
      status: statusFilter,
    }),
    [
      assigneeFilter,
      deferredSearchInput,
      labelFilter,
      priorityFilter,
      statusFilter,
    ]
  );

  // The data layer already filters; keep the alias for clarity.
  const filteredIssues = issues;

  const availableLabels = React.useMemo(
    () => getAvailableLabels(issues),
    [issues]
  );

  const activeFilterCount = React.useMemo(
    () =>
      [
        filters.search,
        filters.status,
        filters.priority,
        filters.assigneeId,
        filters.labelId,
      ].filter(Boolean).length,
    [filters]
  );

  const shouldShowFilters = isFilterPanelOpen || activeFilterCount > 0;

  // Parameters that should be fed into useIssues / the data-fetching layer.
  const issueQueryParams = React.useMemo(
    () => ({
      assigneeIds: assigneeFilter ? [assigneeFilter] : [],
      labelIds: labelFilter ? [labelFilter] : [],
      priorities: priorityFilter ? ([priorityFilter] as IssuePriority[]) : [],
      searchQuery: deferredSearchInput,
      statuses: statusFilter ? ([statusFilter] as IssueStatus[]) : [],
    }),
    [
      assigneeFilter,
      deferredSearchInput,
      labelFilter,
      priorityFilter,
      statusFilter,
    ]
  );

  // ---- URL -> state sync -------------------------------------------------
  React.useEffect(() => {
    const nextFilters = getBoardFilterState(searchParams);

    if (nextFilters.search !== searchInput) {
      setSearchInput(nextFilters.search);
    }
    if (nextFilters.status !== statusFilter) {
      setStatusFilter(nextFilters.status);
    }
    if (nextFilters.priority !== priorityFilter) {
      setPriorityFilter(nextFilters.priority);
    }
    if (nextFilters.assigneeId !== assigneeFilter) {
      setAssigneeFilter(nextFilters.assigneeId);
    }
    if (nextFilters.labelId !== labelFilter) {
      setLabelFilter(nextFilters.labelId);
    }
  }, [
    assigneeFilter,
    labelFilter,
    priorityFilter,
    searchInput,
    searchParams,
    statusFilter,
  ]);

  // ---- state -> URL sync -------------------------------------------------
  React.useEffect(() => {
    setBoardFilterQuery(pathname, searchParams, {
      assigneeId: assigneeFilter,
      labelId: labelFilter,
      priority: priorityFilter,
      search: deferredSearchInput,
      status: statusFilter,
    });
  }, [
    assigneeFilter,
    deferredSearchInput,
    labelFilter,
    pathname,
    priorityFilter,
    searchParams,
    statusFilter,
  ]);

  // ---- Handlers ----------------------------------------------------------

  function updateFilterQuery(key: string, value: string) {
    switch (key) {
      case "statuses":
        setStatusFilter(value);
        break;
      case "priorities":
        setPriorityFilter(value);
        break;
      case "assigneeIds":
        setAssigneeFilter(value);
        break;
      case "labelIds":
        setLabelFilter(value);
        break;
      default:
        break;
    }
  }

  function clearFilters() {
    setSearchInput("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
    setLabelFilter("");
  }

  const toggleFilterPanel = React.useCallback(() => {
    setIsFilterPanelOpen((open) => !open);
  }, []);

  return {
    filters,
    filteredIssues,
    activeFilterCount,
    shouldShowFilters,
    searchInput,
    availableLabels,
    updateFilterQuery,
    clearFilters,
    setSearchInput,
    toggleFilterPanel,
    isFilterPanelOpen,
    issueQueryParams,
  };
}
