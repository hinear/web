"use client";

import { Chip } from "@/components/atoms/Chip";
import type { IssuePriority } from "@/features/issues/types";
import { cn } from "@/lib/utils";

interface IssuePriorityBadgeProps {
  className?: string;
  priority: IssuePriority;
  size?: "sm" | "default";
}

function getPriorityBadgeClassName(priority: IssuePriority) {
  switch (priority) {
    case "Urgent":
      return "border-red-200 bg-red-50 text-red-700";
    case "High":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-slate-200 bg-slate-50 text-slate-500";
    default:
      return "border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] text-[var(--app-color-gray-500)]";
  }
}

export function IssuePriorityBadge({
  className,
  priority,
  size = "default",
}: IssuePriorityBadgeProps) {
  return (
    <Chip
      className={cn(
        "border font-[var(--app-font-weight-600)]",
        getPriorityBadgeClassName(priority),
        size === "sm" ? "text-[10px] leading-none" : "",
        className
      )}
      size={size}
      variant="neutral"
    >
      {priority}
    </Chip>
  );
}
