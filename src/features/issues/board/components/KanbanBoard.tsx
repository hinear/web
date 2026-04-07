"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { useKanbanDnd } from "@/features/issues/board/hooks/use-kanban-dnd";
import { COLUMNS } from "@/features/issues/board/lib/kanban-dnd-utils";
import type { Issue, IssueStatus } from "@/specs/issue-detail.contract";
import { BatchActionBar } from "./BatchActionBar";
import { IssueCard } from "./IssueCard";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  issues: Issue[];
  onAddCard?: (status: IssueStatus) => void;
  onIssueUpdate?: (
    issueId: string,
    updates: Partial<
      Pick<Issue, "description" | "priority" | "status" | "title">
    > & {
      assigneeId?: string | null;
    }
  ) => Promise<Issue | undefined> | Issue | undefined;
  projectId?: string;
  onNavigate?: (issue: Issue) => void;
  onPrefetch?: (issue: Issue) => void;
  assigneeOptions?: Array<{
    label: string;
    value: string;
  }>;
  onClearSelection: () => void;
  onToggleSelect: (issueId: string) => void;
  selectedCount: number;
  selectedIssueIds: string[];
  selectionMode: boolean;
}

export function KanbanBoard({
  issues,
  onAddCard,
  onIssueUpdate,
  projectId,
  onNavigate,
  onPrefetch,
  assigneeOptions = [],
  onClearSelection,
  onToggleSelect,
  selectedCount,
  selectedIssueIds,
  selectionMode,
}: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false);

  const {
    activeIssue,
    sensors,
    handleDragStart,
    handleDragCancel,
    handleDragOver,
    handleDragEnd,
    getIssuesByStatus,
    collisionDetection,
  } = useKanbanDnd({ issues, onIssueUpdate, selectionMode });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full overflow-x-auto">
        <div className="flex h-full min-h-full items-stretch gap-3 p-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              onAddCard={onAddCard}
              onPrefetch={onPrefetch}
              projectId={projectId}
              status={status}
              issues={getIssuesByStatus(status)}
              onNavigate={onNavigate}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto">
      {/* Batch Action Bar */}
      {selectedCount > 0 && projectId && (
        <BatchActionBar
          assigneeOptions={assigneeOptions}
          projectId={projectId}
          selectedCount={selectedCount}
          selectedIssueIds={selectedIssueIds}
          onClearSelection={onClearSelection}
        />
      )}

      <DndContext
        collisionDetection={collisionDetection}
        sensors={sensors}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        <div className="flex h-full min-h-full items-stretch gap-3 p-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              isDragging={activeIssue !== null}
              key={status}
              onAddCard={onAddCard}
              onPrefetch={onPrefetch}
              projectId={projectId}
              status={status}
              issues={getIssuesByStatus(status)}
              onNavigate={onNavigate}
              selectionMode={selectionMode}
              selectedIssueIds={selectedIssueIds}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue && (
            <div className="pointer-events-none origin-center opacity-95">
              <IssueCard issue={activeIssue} preview />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
