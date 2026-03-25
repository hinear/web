"use client";

import { Chip } from "@/components/atoms/Chip";
import { getStatusBadgeColor } from "@/features/issues/lib/issue-state-machine";
import type { IssueStatus } from "@/features/issues/types";
import { cn } from "@/lib/utils";

interface IssueStatusBadgeProps {
  className?: string;
  size?: "sm" | "default";
  status: IssueStatus;
}

export function IssueStatusBadge({
  className,
  size = "default",
  status,
}: IssueStatusBadgeProps) {
  return (
    <Chip
      className={cn(
        "border font-[var(--app-font-weight-600)]",
        getStatusBadgeColor(status),
        size === "sm" ? "text-[10px] leading-none" : "",
        className
      )}
      size={size}
      variant="neutral"
    >
      {status}
    </Chip>
  );
}
