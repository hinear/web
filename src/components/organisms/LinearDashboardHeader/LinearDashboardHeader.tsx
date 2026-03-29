import type * as React from "react";

import { Chip } from "@/components/atoms/Chip";
import {
  HeaderAction,
  HeaderSearchField,
} from "@/components/molecules/HeaderAction";
import { cn } from "@/lib/utils";
import type { Issue } from "@/specs/issue-detail.contract";

const ACTIVE_STATUSES = new Set(["Triage", "Backlog", "Todo", "In Progress"]);

function isBlockedIssue(issue: Issue) {
  return issue.labels.some((label) =>
    label.name.toLowerCase().includes("blocked")
  );
}

export interface LinearDashboardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  activeFilterCount?: number;
  boardHref?: string;
  dashboardHref?: string;
  filterActive?: boolean;
  eyebrow?: string;
  issues?: Issue[];
  onFilterClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onCreateClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onSearchValueChange?: React.ChangeEventHandler<HTMLInputElement>;
  onSelectionModeToggle?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  searchValue?: string;
  selectedCount?: number;
  selectionMode?: boolean;
  subtitle?: string;
  title?: string;
}

export function LinearDashboardHeader({
  activeFilterCount = 0,
  boardHref,
  className,
  dashboardHref,
  filterActive = false,
  eyebrow = "Workspace / Issue Board",
  issues = [],
  onFilterClick,
  onCreateClick,
  onSearchValueChange,
  onSelectionModeToggle,
  searchValue = "",
  selectedCount = 0,
  selectionMode = false,
  subtitle = "Focused view of triage, build, and shipped work.",
  title = "Issue Board",
  ...props
}: LinearDashboardHeaderProps) {
  const activeCount = issues.filter((issue) =>
    ACTIVE_STATUSES.has(issue.status)
  ).length;
  const blockedCount = issues.filter(isBlockedIssue).length;

  return (
    <section
      className={cn(
        "relative z-[1] flex w-full flex-col gap-[14px]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
            {eyebrow}
          </p>
          <h2 className="text-[22px] leading-[1.1] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
            {title}
          </h2>
          <p className="text-[13px] leading-[1.4] font-[var(--app-font-weight-400)] text-[var(--app-color-gray-500)]">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[10px]">
          <HeaderAction
            href={dashboardHref}
            icon="board"
            label="Overview"
            variant="filter"
          />
          <HeaderSearchField
            label="Search issues"
            onChange={onSearchValueChange}
            value={searchValue}
          />
          <HeaderAction
            icon="filter"
            label={
              activeFilterCount > 0 ? `Filter ${activeFilterCount}` : "Filter"
            }
            onClick={onFilterClick}
            variant="filter"
          />
          <HeaderAction
            label={
              selectionMode
                ? selectedCount > 0
                  ? `Done (${selectedCount})`
                  : "Done"
                : "Select"
            }
            onClick={onSelectionModeToggle}
            variant="filter"
          />
          <HeaderAction
            href={boardHref}
            icon="board"
            label="Issue Board"
            variant={filterActive ? "primary" : "board"}
          />
          <HeaderAction
            icon="plus"
            label="New issue"
            onClick={onCreateClick}
            variant="primary"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="neutral">My issues</Chip>
          <Chip variant="neutral">Unassigned</Chip>
          <Chip variant="accent">Updated today</Chip>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="outline">{activeCount} active</Chip>
          <Chip variant="danger">{blockedCount} blocked</Chip>
        </div>
      </div>
    </section>
  );
}
