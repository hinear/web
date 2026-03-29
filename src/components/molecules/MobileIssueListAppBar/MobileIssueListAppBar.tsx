import { Plus, Search } from "lucide-react";
import * as React from "react";

import { cn, hasExplicitAction } from "@/lib/utils";

export interface MobileIssueListAppBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onCreateClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onSearchClick?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  subtitle?: string;
  title: string;
}

function IconActionButton({
  className,
  children,
  disabled = false,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const resolvedDisabled =
    disabled ||
    !hasExplicitAction({
      disabled,
      onClick: props.onClick,
      type,
    });

  return (
    <button
      className={cn(
        "app-mobile-touch-target inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border px-[10px] py-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      disabled={resolvedDisabled}
      title={
        resolvedDisabled && !disabled
          ? "This action is not available yet."
          : props.title
      }
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export const MobileIssueListAppBar = React.forwardRef<
  HTMLDivElement,
  MobileIssueListAppBarProps
>(
  (
    {
      className,
      onCreateClick,
      onSearchClick,
      subtitle = "Issue board",
      title,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "app-mobile-top-surface flex items-center justify-between gap-3",
          className
        )}
        data-testid="mobile-issue-list-app-bar"
        ref={ref}
        {...props}
      >
        <div className="min-w-0">
          <p className="truncate text-[18px] leading-[18px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
            {title}
          </p>
          <p className="mt-[2px] truncate text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
            {subtitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <IconActionButton
            aria-label="Search issues"
            className="border-[var(--app-color-border-soft)] bg-[var(--app-color-white)]"
            onClick={onSearchClick}
          >
            <Search
              aria-hidden="true"
              className="h-[14px] w-[14px] text-[var(--app-color-ink-900)]"
            />
          </IconActionButton>
          <IconActionButton
            aria-label="Create issue"
            className="border-transparent bg-[var(--color-ink-900)]"
            onClick={onCreateClick}
          >
            <Plus
              aria-hidden="true"
              className="h-[14px] w-[14px] text-[var(--app-color-white)]"
            />
          </IconActionButton>
        </div>
      </div>
    );
  }
);

MobileIssueListAppBar.displayName = "MobileIssueListAppBar";
