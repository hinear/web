"use client";

import { Chip } from "@/components/atoms/Chip";
import type { Label } from "@/features/issues/types";
import { cn } from "@/lib/utils";

interface IssueLabelChipProps {
  className?: string;
  label: Label;
  size?: "sm" | "default";
}

function getLabelVariant(label: Label) {
  const normalized = label.name.toLowerCase();

  if (normalized === "copy" || normalized === "analytics") {
    return "violet" as const;
  }

  if (normalized === "blocked") {
    return "danger" as const;
  }

  return "neutral" as const;
}

export function IssueLabelChip({
  className,
  label,
  size = "sm",
}: IssueLabelChipProps) {
  const variant = getLabelVariant(label);

  return (
    <Chip
      className={cn(
        variant === "neutral" &&
          "border-transparent font-[var(--app-font-weight-500)]",
        className
      )}
      size={size}
      style={
        variant === "neutral" && label.color
          ? {
              backgroundColor: `${label.color}1A`,
              color: label.color,
            }
          : undefined
      }
      variant={variant}
    >
      {label.name}
    </Chip>
  );
}
