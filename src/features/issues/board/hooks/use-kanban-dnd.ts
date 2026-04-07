import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COLUMNS,
  customCollisionDetection,
  isColumnId,
  mergeIssuesPreservingOrder,
} from "@/features/issues/board/lib/kanban-dnd-utils";
import type { Issue, IssueStatus } from "@/specs/issue-detail.contract";

interface UseKanbanDndParams {
  issues: Issue[];
  onIssueUpdate?: (
    issueId: string,
    updates: Partial<
      Pick<Issue, "description" | "priority" | "status" | "title">
    > & {
      assigneeId?: string | null;
    }
  ) => Promise<Issue | undefined> | Issue | undefined;
  selectionMode: boolean;
}

export interface UseKanbanDndReturn {
  activeIssue: Issue | null;
  sensors: ReturnType<typeof useSensors>;
  issuesByStatus: Record<IssueStatus, Issue[]>;
  orderedIssues: Issue[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragCancel: () => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  getIssuesByStatus: (status: IssueStatus) => Issue[];
  collisionDetection: typeof customCollisionDetection;
}

export function useKanbanDnd({
  issues,
  onIssueUpdate,
  selectionMode,
}: UseKanbanDndParams): UseKanbanDndReturn {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [orderedIssues, setOrderedIssues] = useState(issues);

  useEffect(() => {
    setOrderedIssues((current) => mergeIssuesPreservingOrder(current, issues));
  }, [issues]);

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

  const getIssuesByStatus = useCallback(
    (status: IssueStatus) => issuesByStatus[status],
    [issuesByStatus]
  );

  const findIssueById = useCallback(
    (issueId: string) => orderedIssues.find((issue) => issue.id === issueId),
    [orderedIssues]
  );

  const getInsertIndex = useCallback(
    (nextIssues: Issue[], overId: string, targetStatus: IssueStatus) => {
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
    },
    []
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (selectionMode) {
        return;
      }
      const issue = findIssueById(event.active.id as string);
      if (issue) {
        setActiveIssue(issue);
      }
    },
    [selectionMode, findIssueById]
  );

  const handleDragCancel = useCallback(() => {
    setOrderedIssues((current) => mergeIssuesPreservingOrder(current, issues));
    setActiveIssue(null);
  }, [issues]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
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
    },
    [getInsertIndex]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const draggedIssue = activeIssue;

      // Immediately clear activeIssue to prepare for the next drag
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
    },
    [activeIssue, findIssueById, onIssueUpdate, issues]
  );

  return {
    activeIssue,
    sensors,
    issuesByStatus,
    orderedIssues,
    handleDragStart,
    handleDragCancel,
    handleDragOver,
    handleDragEnd,
    getIssuesByStatus,
    collisionDetection: customCollisionDetection,
  };
}
