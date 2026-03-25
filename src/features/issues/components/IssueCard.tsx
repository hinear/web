"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check } from "lucide-react";
import { BoardIssueCard } from "@/components/organisms/BoardIssueCard";
import { getIssuePath } from "@/features/projects/lib/project-routes";
import { cn } from "@/lib/utils";
import type { Issue } from "@/specs/issue-detail.contract";

interface IssueCardProps {
  className?: string;
  issue: Issue;
  projectId?: string;
  preview?: boolean;
  onNavigate?: (href: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (issueId: string) => void;
}

export function IssueCard({
  className,
  issue,
  projectId,
  preview = false,
  onNavigate,
  isSelected = false,
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
    disabled: preview,
    data: {
      type: "issue",
      issue,
    },
  });

  const detailHref = projectId ? getIssuePath(projectId, issue.id) : undefined;

  const handleNavigate = () => {
    if (detailHref && onNavigate) {
      onNavigate(detailHref);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(issue.id);
  };

  return (
    <div className={isDragging ? "pointer-events-none" : ""}>
      <div
        className={cn(
          "relative transition-[transform,opacity,box-shadow] duration-200 ease-out",
          preview
            ? "pointer-events-none rotate-[1.5deg] scale-[1.02] cursor-grabbing shadow-[0_24px_48px_rgba(15,23,42,0.18)]"
            : "cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]",
          isDragging ? "scale-[0.985] opacity-20 shadow-none" : "opacity-100",
          isSelected && "ring-2 ring-[#6366F1] ring-offset-2"
        )}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        {/* Checkbox */}
        {!preview && onToggleSelect && (
          <button
            className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border border-[var(--app-color-border-soft)] bg-white transition-colors hover:border-[#6366F1]"
            onClick={handleCheckboxClick}
            type="button"
            aria-label={isSelected ? "Deselect issue" : "Select issue"}
          >
            {isSelected && (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded bg-[#6366F1]">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        )}

        <BoardIssueCard
          assignee={issue.assignee}
          className={cn("touch-none", className)}
          dueDate={issue.dueDate}
          estimate={undefined}
          issueKey={issue.identifier}
          issueTitle={issue.title}
          labels={issue.labels}
          onClick={
            !preview && detailHref && onNavigate ? handleNavigate : undefined
          }
          onKeyDown={
            !preview && detailHref && onNavigate
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
          {...attributes}
          {...listeners}
        />
      </div>
    </div>
  );
}
