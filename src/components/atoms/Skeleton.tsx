"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-[12px] bg-[#E7EAF1]",
        shimmer
          ? "animate-pulse bg-[linear-gradient(110deg,#EEF2F7_8%,#E2E8F0_18%,#EEF2F7_33%)] bg-[length:200%_100%]"
          : undefined,
        className
      )}
      {...props}
    />
  );
}
