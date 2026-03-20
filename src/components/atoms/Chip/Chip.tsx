import type * as React from "react";

import { cn } from "@/lib/utils";

const chipVariantClassNames = {
  neutral:
    "border-transparent bg-[var(--app-color-gray-100)] text-[var(--app-color-gray-700)] font-[var(--app-font-weight-500)]",
  accent:
    "border-transparent bg-[var(--app-color-brand-50)] text-[var(--color-indigo-600)] font-[var(--app-font-weight-500)]",
  outline:
    "border-[var(--app-color-border-soft)] bg-[var(--color-surface-50)] text-[var(--app-color-ink-900)] font-[var(--app-font-weight-600)]",
  danger:
    "border-transparent bg-[var(--color-red-50)] text-[var(--color-red-700)] font-[var(--app-font-weight-600)]",
  violet:
    "border-transparent bg-[var(--color-violet-50)] text-[var(--color-violet-700)] font-[var(--app-font-weight-500)]",
} as const;

const chipSizeClassNames = {
  default: "px-[10px] py-[6px] text-[12px] leading-[12px]",
  sm: "px-2 py-1 text-[11px] leading-[11px]",
} as const;

type ChipVariant = keyof typeof chipVariantClassNames;
type ChipSize = keyof typeof chipSizeClassNames;

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: ChipSize;
  variant?: ChipVariant;
}

export function Chip({
  className,
  size = "default",
  variant = "accent",
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-solid whitespace-nowrap font-[var(--app-font-family-base)]",
        chipVariantClassNames[variant],
        chipSizeClassNames[size],
        className
      )}
      {...props}
    />
  );
}
