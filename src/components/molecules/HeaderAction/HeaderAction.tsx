import {
  Filter,
  LayoutDashboard,
  type LucideIcon,
  Plus,
  Search,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const iconMap = {
  board: LayoutDashboard,
  filter: Filter,
  plus: Plus,
} as const;

type HeaderActionIcon = keyof typeof iconMap;
type HeaderActionVariant = "board" | "filter" | "primary";

const variantClassNames: Record<HeaderActionVariant, string> = {
  board:
    "border-transparent bg-[var(--color-ink-900)] text-[var(--app-color-white)]",
  filter:
    "border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] text-[var(--app-color-ink-900)]",
  primary:
    "border-transparent bg-[var(--app-color-brand-500)] text-[var(--app-color-white)]",
};

const iconClassNames: Record<HeaderActionVariant, string> = {
  board: "text-[var(--app-color-white)]",
  filter: "text-[var(--app-color-ink-900)]",
  primary: "text-[var(--app-color-white)]",
};

const labelClassNames: Record<HeaderActionVariant, string> = {
  board: "font-[var(--app-font-weight-600)] text-[var(--app-color-white)]",
  filter: "font-[var(--app-font-weight-500)] text-[var(--app-color-ink-900)]",
  primary: "font-[var(--app-font-weight-600)] text-[var(--app-color-white)]",
};

export interface HeaderActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: HeaderActionIcon;
  label: string;
  variant?: HeaderActionVariant;
}

export interface HeaderSearchFieldProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const HeaderAction = React.forwardRef<
  HTMLButtonElement,
  HeaderActionProps
>(
  (
    { className, icon, label, type = "button", variant = "filter", ...props },
    ref
  ) => {
    const Icon = (icon ? iconMap[icon] : null) as LucideIcon | null;

    return (
      <button
        className={cn(
          "flex w-fit items-center gap-2 rounded-[10px] border px-3 py-[9px] text-left",
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClassNames[variant],
          className
        )}
        ref={ref}
        type={type}
        {...props}
      >
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn(
              "h-[14px] w-[14px] shrink-0",
              iconClassNames[variant]
            )}
          />
        ) : null}
        <span
          className={cn("text-[13px] leading-[13px]", labelClassNames[variant])}
        >
          {label}
        </span>
      </button>
    );
  }
);

HeaderAction.displayName = "HeaderAction";

export const HeaderSearchField = React.forwardRef<
  HTMLButtonElement,
  HeaderSearchFieldProps
>(({ className, label = "Search", type = "button", ...props }, ref) => {
  return (
    <button
      className={cn(
        "flex w-[220px] items-center gap-2 rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-3 py-[9px] text-left",
        "cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    >
      <Search
        aria-hidden="true"
        className="h-[14px] w-[14px] shrink-0 text-[var(--app-color-gray-400)]"
      />
      <span className="text-[13px] leading-[13px] font-normal text-[var(--app-color-gray-400)]">
        {label}
      </span>
    </button>
  );
});

HeaderSearchField.displayName = "HeaderSearchField";
