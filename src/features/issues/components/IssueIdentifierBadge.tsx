"use client";

import { Chip } from "@/components/atoms/Chip";
import { cn } from "@/lib/utils";

interface IssueIdentifierBadgeProps {
  className?: string;
  identifier: string;
  size?: "sm" | "default";
}

export function IssueIdentifierBadge({
  className,
  identifier,
  size = "default",
}: IssueIdentifierBadgeProps) {
  return (
    <Chip
      className={cn(
        "border-transparent bg-[var(--app-color-brand-25)] text-[var(--app-color-brand-500)] font-[var(--app-font-weight-700)]",
        size === "sm" ? "text-[10px] leading-none" : "",
        className
      )}
      size={size}
      variant="accent"
    >
      {identifier}
    </Chip>
  );
}
