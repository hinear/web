"use client";

import { Avatar } from "@/components/atoms/Avatar";
import { cn } from "@/lib/utils";

interface IssueAssigneePillProps {
  avatarUrl?: string | null;
  className?: string;
  fallbackLabel?: string;
  name?: string | null;
  size?: "sm" | "md";
}

const SIZE_STYLES = {
  md: {
    avatar: 20,
    text: "text-[12px] leading-[12px]",
  },
  sm: {
    avatar: 18,
    text: "text-[11px] leading-[11px]",
  },
} as const;

export function IssueAssigneePill({
  avatarUrl,
  className,
  fallbackLabel = "Unassigned",
  name,
  size = "md",
}: IssueAssigneePillProps) {
  const displayName = name?.trim() || fallbackLabel;
  const styles = SIZE_STYLES[size];

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Avatar
        className="bg-[var(--color-teal-700)]"
        name={displayName}
        size={styles.avatar}
        src={avatarUrl ?? null}
      />
      <span
        className={cn(
          "truncate font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]",
          styles.text
        )}
      >
        {displayName}
      </span>
    </div>
  );
}
