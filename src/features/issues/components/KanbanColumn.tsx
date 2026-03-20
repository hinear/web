"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BoardAddCard } from "@/components/molecules/BoardAddCard";
import { BoardColumnHeader } from "@/components/molecules/BoardColumnHeader";
import { cn } from "@/lib/utils";
import type { Issue, IssueStatus } from "@/specs/issue-detail.contract";
import { IssueCard } from "./IssueCard";

interface KanbanColumnProps {
  activeIssue?: Issue | null;
  forceDropTarget?: boolean;
  isDragging?: boolean;
  status: IssueStatus;
  issues: Issue[];
}

const COLUMN_LABELS: Record<IssueStatus, string> = {
  Triage: "Triage",
  Backlog: "Backlog",
  Todo: "Todo",
  "In Progress": "In Progress",
  Done: "Done",
  Canceled: "Canceled",
};

export function KanbanColumn({
  activeIssue = null,
  forceDropTarget = false,
  isDragging = false,
  status,
  issues,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: {
      type: "column",
      status,
    },
  });

  const isDropTarget = forceDropTarget || (isDragging && isOver);
  const showPlaceholder =
    isDropTarget && activeIssue && activeIssue.status !== status;
  const issueIds = issues.map((issue) => issue.id);

  return (
    <div className="w-[232px] flex-shrink-0">
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[520px] flex-col gap-[10px] rounded-[14px] border p-3 transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
          isDropTarget
            ? "border-[var(--app-color-brand-300)] bg-[var(--app-color-brand-50)] shadow-[inset_0_0_0_1px_var(--app-color-brand-200)]"
            : "border-[var(--app-color-surface-150,#ECEEF2)] bg-[var(--app-color-surface-100,#F7F8FA)]"
        )}
      >
        <BoardColumnHeader
          count={issues.length}
          title={COLUMN_LABELS[status]}
        />

        <SortableContext
          items={issueIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-1 flex-col gap-[10px]">
            {issues.map((issue) => (
              <IssueCard className="w-full" key={issue.id} issue={issue} />
            ))}

            {showPlaceholder ? (
              <>
                <p className="text-[13px] leading-[1.4] font-[var(--app-font-weight-500)] text-[var(--app-color-brand-700)]">
                  Drop the dragged card into this lane.
                </p>
                <div className="h-[72px] rounded-[14px] border-2 border-[var(--app-color-brand-300)] bg-[var(--app-color-white)] shadow-[0_10px_24px_rgba(94,106,210,0.08)] transition-all duration-200 ease-out" />
              </>
            ) : null}

            {issues.length === 0 && !showPlaceholder && (
              <div className="rounded-[12px] border border-dashed border-[var(--app-color-border-soft,#D7DCE5)] bg-[var(--app-color-white)] px-3 py-6 text-center text-[13px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-400)]">
                No issues yet
              </div>
            )}

            <BoardAddCard className="mt-auto w-full" label="Add card" />
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
