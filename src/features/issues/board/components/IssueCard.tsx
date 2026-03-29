"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef } from "react";
import { BoardIssueCard } from "@/components/organisms/BoardIssueCard";
import { getIssuePath } from "@/features/projects/lib/project-routes";
import { cn } from "@/lib/utils";
import type { Issue } from "@/specs/issue-detail.contract";

interface IssueCardProps {
  className?: string;
  issue: Issue;
  projectId?: string;
  preview?: boolean;
  onNavigate?: (issue: Issue) => void;
  onPrefetch?: (issue: Issue) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (issueId: string) => void;
}

export function IssueCard({
  className,
  issue,
  projectId,
  preview = false,
  onNavigate,
  onPrefetch,
  isSelected = false,
  selectionMode = false,
  onToggleSelect,
}: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: issue.id,
    disabled: preview || selectionMode,
    data: {
      type: "issue",
      issue,
    },
  });
  const observedElementRef = useRef<HTMLDivElement | null>(null);
  const hasViewportPrefetchedRef = useRef(false);

  const detailHref = projectId ? getIssuePath(projectId, issue.id) : undefined;

  const handleNavigate = () => {
    if (detailHref && onNavigate) {
      onNavigate(issue);
    }
  };

  const handleSelectToggle = () => {
    onToggleSelect?.(issue.id);
  };

  useEffect(() => {
    if (preview || !onPrefetch || typeof IntersectionObserver === "undefined") {
      return;
    }

    const node = observedElementRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting || hasViewportPrefetchedRef.current) {
          return;
        }

        hasViewportPrefetchedRef.current = true;
        onPrefetch(issue);
        observer.disconnect();
      },
      {
        threshold: 0.25,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [issue, onPrefetch, preview]);

  return (
    <div
      className={isDragging ? "pointer-events-none" : ""}
      ref={observedElementRef}
    >
      <div
        className={cn(
          "relative transition-[transform,opacity,box-shadow] duration-200 ease-out",
          preview
            ? "pointer-events-none rotate-[1.5deg] scale-[1.02] cursor-grabbing shadow-[0_24px_48px_rgba(15,23,42,0.18)]"
            : selectionMode
              ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]"
              : "cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]",
          isDragging ? "scale-[0.985] opacity-20 shadow-none" : "opacity-100",
          isSelected &&
            "rounded-[12px] border border-[#6366F1] shadow-[0_0_0_1px_#6366F1]"
        )}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        <BoardIssueCard
          assignee={issue.assignee}
          className={cn("touch-none", className)}
          dueDate={issue.dueDate}
          estimate={undefined}
          issueKey={issue.identifier}
          issueStatus={issue.status}
          issueTitle={issue.title}
          labels={issue.labels}
          onFocus={preview ? undefined : () => onPrefetch?.(issue)}
          onClick={
            preview
              ? undefined
              : selectionMode
                ? handleSelectToggle
                : detailHref && onNavigate
                  ? handleNavigate
                  : undefined
          }
          onKeyDown={
            preview
              ? undefined
              : selectionMode
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectToggle();
                    }
                  }
                : detailHref && onNavigate
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleNavigate();
                      }
                    }
                  : undefined
          }
          priority={issue.priority}
          ref={setNodeRef}
          {...(!selectionMode ? attributes : {})}
          {...(!selectionMode ? listeners : {})}
        />
      </div>
    </div>
  );
}
