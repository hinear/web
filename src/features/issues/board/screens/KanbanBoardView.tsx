"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { MobileIssueListAppBar } from "@/components/molecules/MobileIssueListAppBar";
import { LinearDashboardHeader } from "@/components/organisms/LinearDashboardHeader";
import { MobileIssueSections } from "@/components/organisms/MobileIssueSections";
import { BoardFilters } from "@/features/issues/board/components/board-filters";
import { BoardProjectSwitcher } from "@/features/issues/board/components/board-project-switcher";
import { KanbanBoard } from "@/features/issues/board/components/KanbanBoard";
import { useBoardFilters } from "@/features/issues/board/hooks/use-board-filters";
import { useIssueSelection } from "@/features/issues/hooks/useIssueSelection";
import { useIssues } from "@/features/issues/hooks/useIssues";
import { prefetchIssueDetail } from "@/features/issues/lib/issue-detail-client-cache";
import { updateIssueDrawerUrl } from "@/features/issues/lib/issue-drawer-url";
import { getProjectIssueCreatePath } from "@/features/projects/lib/project-routes";
import type { Issue, IssueStatus } from "@/specs/issue-detail.contract";

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

export interface KanbanBoardViewProps {
  assigneeOptions?: Array<{
    label: string;
    value: string;
  }>;
  boardHref?: string;
  createIssueAction?: React.ComponentProps<"form">["action"];
  dashboardHref?: string;
  initialIssues?: Issue[];
  projectId: string;
  projectKey?: string;
  projectName?: string;
  projectOptions?: Array<{
    active?: boolean;
    href?: string;
    label: string;
  }>;
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
  const prefetchedIssueIdsRef = React.useRef(new Set<string>());
  const [createModalStatus, setCreateModalStatus] =
    React.useState<IssueStatus | null>(null);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const {
    clearSelection,
    selectIssue,
    selectedCount,
    selectedIssueIds,
    toggleIssue,
  } = useIssueSelection();

  // Board filter hook manages all filter state, URL sync, and derived data.
  // We keep a ref to the issues from useIssues so the hook can compute
  // availableLabels from the latest data without creating a circular
  // dependency (the hook's issueQueryParams feed useIssues, whose output
  // feeds back into the hook via the ref).
  const issuesRef = React.useRef<Issue[]>([]);

  const {
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
    issueQueryParams,
  } = useBoardFilters({ issues: issuesRef.current });

  // Fetch issues using filter params derived by the hook
  const { issues, error, isUpdatingIssues, mutationError, updateIssue } =
    useIssues(projectId, issueQueryParams);

  // Keep the ref in sync so the hook sees the latest issues on re-render
  issuesRef.current = issues;

  const openIssueCreateFlow = React.useCallback(() => {
    if (createIssueAction) {
      setCreateModalStatus("Triage");
      return;
    }

    router.push(getProjectIssueCreatePath(projectId));
  }, [createIssueAction, projectId, router]);

  const openIssueDrawer = React.useCallback(
    (issue: Issue) => {
      prefetchIssueDetail(projectId, issue.id);
      void import("@/features/issues/detail/screens/issue-drawer-with-router");
      updateIssueDrawerUrl(pathname, searchParams, issue.id, "push");
    },
    [pathname, projectId, searchParams]
  );

  const prefetchIssueDrawer = React.useCallback(
    (issue: Issue) => {
      if (prefetchedIssueIdsRef.current.has(issue.id)) {
        return;
      }

      prefetchedIssueIdsRef.current.add(issue.id);
      prefetchIssueDetail(projectId, issue.id);
      void import("@/features/issues/detail/screens/issue-drawer-with-router");
    },
    [projectId]
  );

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
            onCreateClick={openIssueCreateFlow}
            onSearchClick={toggleFilterPanel}
            title={projectName}
          />
          <BoardProjectSwitcher
            projectName={projectName}
            projectOptions={projectOptions}
          />
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
          {!shouldShowFilters ? (
            <p className="text-[12px] leading-[1.45] text-[#6B7280]">
              Use search or filters to narrow the board, or open the issue
              create flow to capture new work.
            </p>
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
          filterActive={shouldShowFilters}
          issues={filteredIssues}
          onCreateClick={openIssueCreateFlow}
          onFilterClick={toggleFilterPanel}
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
        {!shouldShowFilters ? (
          <p className="text-[12px] leading-[1.45] text-[#6B7280]">
            Search, filter, or open the issue create flow to keep work moving
            from the board.
          </p>
        ) : null}
        {isUpdatingIssues ? (
          <p className="text-[12px] leading-[1.45] text-[#4338CA]">
            Updating the board. Duplicate status changes are temporarily blocked
            until the current request finishes.
          </p>
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
            onNavigate={openIssueDrawer}
            onIssueUpdate={updateIssue}
            onPrefetch={prefetchIssueDrawer}
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
