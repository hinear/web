"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
}

export function IssueCard({
  className,
  issue,
  projectId,
  preview = false,
  onNavigate,
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

  return (
    <div className={isDragging ? "pointer-events-none" : ""}>
      <BoardIssueCard
        assignee={issue.assignee}
        className={cn(
          "touch-none transition-[transform,opacity,box-shadow] duration-200 ease-out",
          preview
            ? "pointer-events-none rotate-[1.5deg] scale-[1.02] cursor-grabbing shadow-[0_24px_48px_rgba(15,23,42,0.18)]"
            : "cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]",
          isDragging ? "scale-[0.985] opacity-20 shadow-none" : "opacity-100",
          className
        )}
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
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        {...attributes}
        {...listeners}
      />
    </div>
  );
}
