"use client";

import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import type { Issue, IssueStatus } from "@/specs/issue-detail.contract";
import { useIssueSelection } from "../hooks/useIssueSelection";
import { BatchActionBar } from "./BatchActionBar";
import { IssueCard } from "./IssueCard";
import { KanbanColumn } from "./KanbanColumn";

const COLUMNS: IssueStatus[] = [
  "Triage",
  "Backlog",
  "Todo",
  "In Progress",
  "Done",
  "Canceled",
];

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
  onNavigate?: (href: string) => void;
  assigneeOptions?: Array<{
    label: string;
    value: string;
  }>;
}

function mergeIssuesPreservingOrder(previous: Issue[], next: Issue[]): Issue[] {
  const nextById = new Map(next.map((issue) => [issue.id, issue]));
  const ordered = previous
    .map((issue) => nextById.get(issue.id))
    .filter((issue): issue is Issue => Boolean(issue));
  const seen = new Set(ordered.map((issue) => issue.id));

  for (const issue of next) {
    if (!seen.has(issue.id)) {
      ordered.push(issue);
    }
  }

  return ordered;
}

function isColumnId(id: string): id is IssueStatus {
  return COLUMNS.includes(id as IssueStatus);
}

// 카드 영역을 제외하고 컬럼 빈 공간만 드롭 타겟으로 인식
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  // 컬럼 id(IssueStatus)만 남기기 - 카드 위에 있을 때는 컬럼 드롭 타겟 비활성화
  return pointerCollisions.filter((collision) => {
    const { id } = collision;
    return isColumnId(id as string);
  });
};

export function KanbanBoard({
  issues,
  onAddCard,
  onIssueUpdate,
  projectId,
  onNavigate,
  assigneeOptions = [],
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [mounted, setMounted] = useState(false);
  const [orderedIssues, setOrderedIssues] = useState(issues);

  const {
    isSelected,
    selectedCount,
    selectedIssueIds,
    toggleIssue,
    clearSelection,
  } = useIssueSelection();

  useEffect(() => {
    setOrderedIssues((current) => mergeIssuesPreservingOrder(current, issues));
  }, [issues]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    })
  );

  const issuesByStatus = useMemo(
    () =>
      COLUMNS.reduce<Record<IssueStatus, Issue[]>>(
        (result, status) => {
          result[status] = orderedIssues.filter(
            (issue) => issue.status === status
          );
          return result;
        },
        {} as Record<IssueStatus, Issue[]>
      ),
    [orderedIssues]
  );

  const getIssuesByStatus = (status: IssueStatus) => issuesByStatus[status];

  const findIssueById = (issueId: string) =>
    orderedIssues.find((issue) => issue.id === issueId);

  const getInsertIndex = (
    nextIssues: Issue[],
    overId: string,
    targetStatus: IssueStatus
  ) => {
    if (!isColumnId(overId)) {
      const overIndex = nextIssues.findIndex((issue) => issue.id === overId);
      if (overIndex >= 0) {
        return overIndex;
      }
    }

    const lastIndexInColumn = nextIssues.reduce((lastIndex, issue, index) => {
      if (issue.status === targetStatus) {
        return index;
      }

      return lastIndex;
    }, -1);

    return lastIndexInColumn + 1;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const issue = findIssueById(event.active.id as string);
    if (issue) {
      setActiveIssue(issue);
    }
  };

  const handleDragCancel = () => {
    setOrderedIssues((current) => mergeIssuesPreservingOrder(current, issues));
    setActiveIssue(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    setOrderedIssues((current) => {
      const activeIndex = current.findIndex((issue) => issue.id === activeId);

      if (activeIndex < 0 || activeId === overId) {
        return current;
      }

      const activeItem = current[activeIndex];
      const overStatus = isColumnId(overId)
        ? overId
        : (current.find((issue) => issue.id === overId)?.status ?? null);

      if (!overStatus) {
        return current;
      }

      if (!isColumnId(overId) && activeItem.status === overStatus) {
        const overIndex = current.findIndex((issue) => issue.id === overId);

        if (overIndex < 0 || overIndex === activeIndex) {
          return current;
        }

        return arrayMove(current, activeIndex, overIndex);
      }

      const nextIssues = current.slice();
      nextIssues.splice(activeIndex, 1);

      const movedIssue: Issue = {
        ...activeItem,
        status: overStatus,
      };
      const insertIndex = getInsertIndex(nextIssues, overId, overStatus);
      nextIssues.splice(insertIndex, 0, movedIssue);

      return nextIssues;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedIssue = activeIssue;

    // 즉시 activeIssue 초기화하여 다음 드래그 준비
    setActiveIssue(null);

    if (!draggedIssue || !over) {
      return;
    }

    const overId = over.id as string;
    const newStatus = isColumnId(overId)
      ? overId
      : (findIssueById(overId)?.status ?? null);

    if (!newStatus || draggedIssue.status === newStatus) {
      return;
    }

    const updateResult = onIssueUpdate?.(active.id as string, {
      status: newStatus,
    });

    if (updateResult instanceof Promise) {
      void updateResult.catch(() => {
        setOrderedIssues((current) =>
          mergeIssuesPreservingOrder(current, issues)
        );
      });
    }
  };

  if (!mounted) {
    return (
      <div className="h-full overflow-x-auto">
        <div className="flex h-full min-h-full items-stretch gap-3 p-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              onAddCard={onAddCard}
              projectId={projectId}
              status={status}
              issues={getIssuesByStatus(status)}
              onNavigate={onNavigate}
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
          onClearSelection={clearSelection}
        />
      )}

      <DndContext
        collisionDetection={customCollisionDetection}
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
              projectId={projectId}
              status={status}
              issues={getIssuesByStatus(status)}
              onNavigate={onNavigate}
              selectedIssueIds={selectedIssueIds}
              onToggleSelect={toggleIssue}
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
