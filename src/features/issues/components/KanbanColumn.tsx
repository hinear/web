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
  forceDropTarget?: boolean;
  isDragging?: boolean;
  onAddCard?: (status: IssueStatus) => void;
  projectId?: string;
  status: IssueStatus;
  issues: Issue[];
  onNavigate?: (href: string) => void;
  selectedIssueIds?: string[];
  onToggleSelect?: (issueId: string) => void;
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
  forceDropTarget = false,
  isDragging = false,
  onAddCard,
  projectId,
  status,
  issues,
  onNavigate,
  selectedIssueIds = [],
  onToggleSelect,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: {
      type: "column",
      status,
    },
  });

  const isDropTarget = forceDropTarget || (isDragging && isOver);

  const issueIds = issues.map((issue) => issue.id);

  return (
    <div className="flex h-full w-[232px] flex-shrink-0 p-2">
      <div
        ref={setNodeRef}
        className={cn(
          "flex h-full min-h-[520px] flex-1 flex-col gap-[10px] rounded-[14px] border p-3 transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
          "border-[#ECEEF2] bg-[#F7F8FA]",
          isDropTarget &&
            "border-[#C7D2FE] bg-[#EEF2FF] shadow-[inset_0_0_0_1px_#A5B4FC]"
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
          <div className="flex min-h-0 flex-1 flex-col gap-[10px]">
            {issues.map((issue) => (
              <IssueCard
                className="w-full"
                issue={issue}
                isSelected={selectedIssueIds.includes(issue.id)}
                key={issue.id}
                onToggleSelect={onToggleSelect}
                projectId={projectId}
                onNavigate={onNavigate}
              />
            ))}

            {issues.length === 0 && (
              <div className="rounded-[12px] border border-dashed border-[var(--app-color-border-soft,#D7DCE5)] bg-[var(--app-color-white)] px-3 py-6 text-center text-[13px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-400)]">
                No issues yet
              </div>
            )}

            <BoardAddCard
              className="mt-auto w-full"
              label="Add card"
              onClick={() => onAddCard?.(status)}
            />
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
