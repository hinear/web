"use client";

import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Chip } from "@/components/atoms/Chip";
import { Select } from "@/components/atoms/Select/Select";
import { MobileIssueListAppBar } from "@/components/molecules/MobileIssueListAppBar";
import { LinearDashboardHeader } from "@/components/organisms/LinearDashboardHeader";
import { MobileIssueSections } from "@/components/organisms/MobileIssueSections";
import { getProjectIssueCreatePath } from "@/features/projects/lib/project-routes";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  type Issue,
  type IssuePriority,
  type IssueStatus,
} from "@/specs/issue-detail.contract";
import { useIssueSelection } from "../hooks/useIssueSelection";
import { useIssues } from "../hooks/useIssues";
import { KanbanBoard } from "./KanbanBoard";

const CreateIssueTabletModal = dynamic(
  () =>
    import("@/components/organisms/CreateIssueTabletModal").then((module) => ({
      default: module.CreateIssueTabletModal,
    })),
  {
    loading: () => (
      <div className="relative z-10 w-full max-w-[720px] rounded-[16px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-6 shadow-[0_24px_48px_rgba(15,23,42,0.14)]">
        <div className="h-6 w-40 animate-pulse rounded bg-[var(--app-color-gray-100)]" />
        <div className="mt-6 h-11 animate-pulse rounded-[10px] bg-[var(--app-color-gray-100)]" />
        <div className="mt-4 h-40 animate-pulse rounded-[10px] bg-[var(--app-color-gray-100)]" />
      </div>
    ),
  }
);

interface KanbanBoardViewProps {
  assigneeOptions?: Array<{
    label: string;
    value: string;
  }>;
  boardHref?: string;
  createIssueAction?: React.ComponentProps<"form">["action"];
  dashboardHref?: string;
  projectId: string;
  projectKey?: string;
  projectName?: string;
  projectOptions?: Array<{
    active?: boolean;
    href?: string;
    label: string;
  }>;
}

function MobileProjectSwitcher({
  projectName,
  projectOptions = [],
}: {
  projectName: string;
  projectOptions?: Array<{
    active?: boolean;
    href?: string;
    label: string;
  }>;
}) {
  return (
    <details className="group rounded-[12px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)]">
      <summary className="flex list-none items-center justify-between gap-3 px-3 py-[10px] marker:content-none">
        <div className="min-w-0">
          <p className="text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
            Project
          </p>
          <p className="mt-[2px] truncate text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
            {projectName}
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--app-color-gray-500)] transition-transform group-open:rotate-180"
        />
      </summary>

      {projectOptions.length > 0 ? (
        <div className="border-t border-[var(--app-color-border-soft)] px-2 py-2">
          <div className="flex flex-col gap-1">
            {projectOptions.map((project) =>
              project.href ? (
                <Link
                  className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                    project.active
                      ? "bg-[var(--app-color-gray-100)] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]"
                      : "font-[var(--app-font-weight-500)] text-[#4B5563]"
                  }`}
                  href={project.href}
                  key={project.href}
                >
                  {project.label}
                </Link>
              ) : (
                <div
                  className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                    project.active
                      ? "bg-[var(--app-color-gray-100)] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]"
                      : "font-[var(--app-font-weight-500)] text-[#4B5563]"
                  }`}
                  key={project.label}
                >
                  {project.label}
                </div>
              )
            )}
          </div>
        </div>
      ) : null}
    </details>
  );
}

function MobileIssueFilterChips() {
  return null;
}

interface BoardFilterState {
  assigneeId: string;
  labelId: string;
  priority: string;
  search: string;
  status: string;
}

interface BoardFiltersProps {
  activeFilterCount: number;
  assigneeOptions: Array<{
    label: string;
    value: string;
  }>;
  availableLabels: Array<{
    color: string;
    id: string;
    name: string;
  }>;
  filters: BoardFilterState;
  onAssigneeChange: (value: string) => void;
  onClear: () => void;
  onLabelChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

function getSingleQueryValue(
  searchParams: ReturnType<typeof useSearchParams>,
  key: string
) {
  return searchParams.get(key)?.split(",")[0] ?? "";
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

function BoardFilters({
  activeFilterCount,
  assigneeOptions,
  availableLabels,
  filters,
  onAssigneeChange,
  onClear,
  onLabelChange,
  onPriorityChange,
  onSearchChange,
  onStatusChange,
  resultCount,
  totalCount,
}: BoardFiltersProps) {
  const selectableAssigneeOptions = assigneeOptions.filter(
    (option) => option.value
  );

  return (
    <div className="rounded-[18px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-[var(--app-font-weight-600)] tracking-[0.08em] text-[var(--app-color-gray-500)] uppercase">
              Search
            </span>
            <input
              className="h-11 rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-4 text-[14px] text-[var(--app-color-ink-900)] outline-none transition focus:border-[var(--app-color-brand-300)]"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Title, identifier, label..."
              type="search"
              value={filters.search}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-[var(--app-font-weight-600)] tracking-[0.08em] text-[var(--app-color-gray-500)] uppercase">
              Status
            </span>
            <Select onValueChange={onStatusChange} value={filters.status}>
              <option value="">All statuses</option>
              {ISSUE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-[var(--app-font-weight-600)] tracking-[0.08em] text-[var(--app-color-gray-500)] uppercase">
              Priority
            </span>
            <Select onValueChange={onPriorityChange} value={filters.priority}>
              <option value="">All priorities</option>
              {ISSUE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-[var(--app-font-weight-600)] tracking-[0.08em] text-[var(--app-color-gray-500)] uppercase">
              Assignee
            </span>
            <Select onValueChange={onAssigneeChange} value={filters.assigneeId}>
              <option value="">All assignees</option>
              {selectableAssigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-[var(--app-font-weight-600)] tracking-[0.08em] text-[var(--app-color-gray-500)] uppercase">
              Label
            </span>
            <Select onValueChange={onLabelChange} value={filters.labelId}>
              <option value="">All labels</option>
              {availableLabels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="accent">
              {resultCount} of {totalCount} issues
            </Chip>
            {filters.status ? (
              <Chip size="sm" variant="neutral">
                Status: {filters.status}
              </Chip>
            ) : null}
            {filters.priority ? (
              <Chip size="sm" variant="neutral">
                Priority: {filters.priority}
              </Chip>
            ) : null}
            {filters.assigneeId ? (
              <Chip size="sm" variant="neutral">
                Assignee filtered
              </Chip>
            ) : null}
            {filters.labelId ? (
              <Chip size="sm" variant="neutral">
                Label filtered
              </Chip>
            ) : null}
            {filters.search ? (
              <Chip size="sm" variant="outline">
                Search: {filters.search}
              </Chip>
            ) : null}
          </div>

          <button
            className="rounded-[10px] border border-[var(--app-color-border-soft)] px-3 py-2 text-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)] disabled:opacity-50"
            disabled={activeFilterCount === 0}
            onClick={onClear}
            type="button"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}

export function KanbanBoardView({
  assigneeOptions,
  boardHref,
  createIssueAction,
  dashboardHref,
  projectId,
  projectKey,
  projectName = "Project",
  projectOptions,
}: KanbanBoardViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createModalStatus, setCreateModalStatus] =
    React.useState<IssueStatus | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState(false);
  const [isNavigatingFilters, startFilterTransition] = React.useTransition();
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(
    getSingleQueryValue(searchParams, "search")
  );
  const statusFilter = getSingleQueryValue(searchParams, "statuses");
  const priorityFilter = getSingleQueryValue(searchParams, "priorities");
  const assigneeFilter = getSingleQueryValue(searchParams, "assigneeIds");
  const labelFilter = getSingleQueryValue(searchParams, "labelIds");
  const deferredSearchInput = React.useDeferredValue(searchInput);
  const {
    clearSelection,
    selectIssue,
    selectedCount,
    selectedIssueIds,
    toggleIssue,
  } = useIssueSelection();
  const { issues, loading, error, mutationError, updateIssue } = useIssues(
    projectId,
    {
      assigneeIds: assigneeFilter ? [assigneeFilter] : [],
      labelIds: labelFilter ? [labelFilter] : [],
      priorities: priorityFilter ? [priorityFilter as IssuePriority] : [],
      searchQuery: deferredSearchInput,
      statuses: statusFilter ? [statusFilter as IssueStatus] : [],
    }
  );
  const availableLabels = getAvailableLabels(issues);
  const filters: BoardFilterState = {
    assigneeId: assigneeFilter,
    labelId: labelFilter,
    priority: priorityFilter,
    search: deferredSearchInput.trim(),
    status: statusFilter,
  };
  const filteredIssues = issues;
  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.priority,
    filters.assigneeId,
    filters.labelId,
  ].filter(Boolean).length;
  const shouldShowFilters = isFilterPanelOpen || activeFilterCount > 0;

  const handleSelectionModeToggle = React.useCallback(() => {
    setSelectionMode((current) => {
      if (current) {
        clearSelection();
      }

      return !current;
    });
  }, [clearSelection]);

  const handleMobileEnterSelectionMode = React.useCallback(
    (issueId: string) => {
      setSelectionMode(true);
      selectIssue(issueId);
    },
    [selectIssue]
  );

  // Show toast on mutation error
  React.useEffect(() => {
    if (mutationError) {
      toast.error("We couldn't update the board. Try again.");
    }
  }, [mutationError]);

  React.useEffect(() => {
    const nextSearch = getSingleQueryValue(searchParams, "search");
    if (nextSearch !== searchInput) {
      setSearchInput(nextSearch);
    }
  }, [searchInput, searchParams]);

  React.useEffect(() => {
    if (!createModalStatus) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCreateModalStatus(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createModalStatus]);

  React.useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const nextSearch = deferredSearchInput.trim();

    if (nextSearch) {
      nextParams.set("search", nextSearch);
    } else {
      nextParams.delete("search");
    }

    const currentQuery = searchParams.toString();
    const nextQuery = nextParams.toString();

    if (currentQuery === nextQuery) {
      return;
    }

    startFilterTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }, [deferredSearchInput, pathname, router, searchParams]);

  function updateFilterQuery(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    const currentQuery = searchParams.toString();
    const nextQuery = nextParams.toString();

    if (currentQuery === nextQuery) {
      return;
    }

    startFilterTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }

  function clearFilters() {
    setSearchInput("");

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("search");
    nextParams.delete("statuses");
    nextParams.delete("priorities");
    nextParams.delete("assigneeIds");
    nextParams.delete("labelIds");

    const currentQuery = searchParams.toString();
    const nextQuery = nextParams.toString();

    if (currentQuery === nextQuery) {
      return;
    }

    startFilterTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-[var(--border)] bg-[#F7F8FA] px-6 py-10">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#D6DAF8] border-t-[var(--app-color-brand-500)]" />
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
              Loading board
            </p>
            <p className="text-[16px] font-semibold text-[#111318]">
              Fetching the latest issues for {projectName}.
            </p>
            <p className="text-[13px] font-medium text-[#6B7280]">
              Cards and counts will appear as soon as the project data is ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-[#FCA5A5] bg-[#FEF2F2] p-5 text-[#991B1B] shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Board unavailable
          </p>
          <p className="text-base font-semibold">
            We couldn&apos;t load the {projectName} board right now.
          </p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-full flex-col gap-6">
      <div className="md:hidden">
        <div className="flex flex-col gap-4">
          <MobileIssueListAppBar
            onCreateClick={() =>
              router.push(getProjectIssueCreatePath(projectId))
            }
            onSearchClick={() => setIsFilterPanelOpen((open) => !open)}
            title={projectName}
          />
          <MobileProjectSwitcher
            projectName={projectName}
            projectOptions={projectOptions}
          />
          <MobileIssueFilterChips />
          {selectionMode ? (
            <div className="flex items-center justify-between rounded-[14px] border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3">
              <div className="flex flex-col gap-1">
                <p className="text-[12px] font-[var(--app-font-weight-600)] text-[#4338CA]">
                  Selection mode
                </p>
                <p className="text-[12px] text-[#4F46E5]">
                  {selectedCount} issue{selectedCount === 1 ? "" : "s"} selected
                </p>
              </div>
              <button
                className="rounded-[10px] border border-[#A5B4FC] bg-white px-3 py-2 text-[12px] font-[var(--app-font-weight-600)] text-[#4338CA]"
                onClick={handleSelectionModeToggle}
                type="button"
              >
                Done
              </button>
            </div>
          ) : null}
          {shouldShowFilters ? (
            <BoardFilters
              activeFilterCount={activeFilterCount}
              assigneeOptions={assigneeOptions ?? []}
              availableLabels={availableLabels}
              filters={{
                ...filters,
                search: searchInput,
              }}
              onAssigneeChange={(value) =>
                updateFilterQuery("assigneeIds", value)
              }
              onClear={clearFilters}
              onLabelChange={(value) => updateFilterQuery("labelIds", value)}
              onPriorityChange={(value) =>
                updateFilterQuery("priorities", value)
              }
              onSearchChange={setSearchInput}
              onStatusChange={(value) => updateFilterQuery("statuses", value)}
              resultCount={filteredIssues.length}
              totalCount={issues.length}
            />
          ) : null}
          <MobileIssueSections
            issues={filteredIssues}
            onEnterSelectionMode={handleMobileEnterSelectionMode}
            onToggleSelect={toggleIssue}
            projectId={projectId}
            selectedIssueIds={selectedIssueIds}
            selectionMode={selectionMode}
            statuses={[
              "Triage",
              "In Progress",
              "Done",
              "Backlog",
              "Todo",
              "Canceled",
            ]}
          />
        </div>
      </div>
      <div className="hidden min-h-0 flex-1 flex-col gap-5 md:flex">
        <LinearDashboardHeader
          activeFilterCount={activeFilterCount}
          boardHref={boardHref}
          dashboardHref={dashboardHref}
          eyebrow={`${projectName} / ${projectKey ?? "PRJ"}`}
          filterActive={shouldShowFilters || isNavigatingFilters}
          issues={filteredIssues}
          onCreateClick={() => setCreateModalStatus("Triage")}
          onFilterClick={() => setIsFilterPanelOpen((open) => !open)}
          onSearchValueChange={(event) => setSearchInput(event.target.value)}
          onSelectionModeToggle={handleSelectionModeToggle}
          searchValue={searchInput}
          selectedCount={selectedCount}
          selectionMode={selectionMode}
          subtitle="Focused view of triage, build, and shipped work."
          title="Issue board"
        />

        {shouldShowFilters ? (
          <BoardFilters
            activeFilterCount={activeFilterCount}
            assigneeOptions={assigneeOptions ?? []}
            availableLabels={availableLabels}
            filters={{
              ...filters,
              search: searchInput,
            }}
            onAssigneeChange={(value) =>
              updateFilterQuery("assigneeIds", value)
            }
            onClear={clearFilters}
            onLabelChange={(value) => updateFilterQuery("labelIds", value)}
            onPriorityChange={(value) => updateFilterQuery("priorities", value)}
            onSearchChange={setSearchInput}
            onStatusChange={(value) => updateFilterQuery("statuses", value)}
            resultCount={filteredIssues.length}
            totalCount={issues.length}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden">
          <KanbanBoard
            assigneeOptions={assigneeOptions ?? []}
            issues={filteredIssues}
            onAddCard={setCreateModalStatus}
            onClearSelection={() => {
              clearSelection();
              setSelectionMode(false);
            }}
            onNavigate={(href) => router.push(href)}
            onIssueUpdate={updateIssue}
            onToggleSelect={toggleIssue}
            projectId={projectId}
            selectedCount={selectedCount}
            selectedIssueIds={selectedIssueIds}
            selectionMode={selectionMode}
          />
        </div>
      </div>

      {createModalStatus ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10">
          <button
            aria-label="Close issue create modal"
            className="absolute inset-0 bg-[rgba(15,23,42,0.36)]"
            onClick={() => setCreateModalStatus(null)}
            type="button"
          />
          <CreateIssueTabletModal
            action={createIssueAction}
            assigneeOptions={assigneeOptions}
            className="relative z-10 max-h-[calc(100vh-80px)] overflow-y-auto"
            defaultStatus={createModalStatus}
            onClick={(event) => event.stopPropagation()}
            onCancel={() => setCreateModalStatus(null)}
            onClose={() => setCreateModalStatus(null)}
            projectId={projectId}
          />
        </div>
      ) : null}
    </div>
  );
}
