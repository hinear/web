"use client";

import { Chip } from "@/components/atoms/Chip";
import { Select } from "@/components/atoms/Select";
import type { BoardFilterState } from "@/features/issues/board/hooks/use-board-filters";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
} from "@/specs/issue-detail.contract";

export interface BoardFiltersProps {
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

export function BoardFilters({
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
