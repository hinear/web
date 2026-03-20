import { Circle, Inbox, Layers, Map as MapIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type SidebarItemKind = "nav" | "project";
export type SidebarItemVariant =
  | "issues"
  | "triage"
  | "active"
  | "backlog"
  | "roadmap";

const sidebarItemVariantMap: Record<
  SidebarItemVariant,
  {
    active?: boolean;
    icon: React.ReactNode;
    kind: SidebarItemKind;
    label: string;
  }
> = {
  issues: {
    icon: <Layers className="h-4 w-4" />,
    kind: "nav",
    label: "Issues",
  },
  triage: {
    icon: <Inbox className="h-4 w-4" />,
    kind: "nav",
    label: "Triage",
  },
  active: {
    active: true,
    icon: <Circle className="h-4 w-4 fill-current stroke-none" />,
    kind: "nav",
    label: "Active",
  },
  backlog: {
    icon: <Circle className="h-4 w-4" />,
    kind: "nav",
    label: "Backlog",
  },
  roadmap: {
    icon: <MapIcon className="h-4 w-4" />,
    kind: "nav",
    label: "Roadmap",
  },
};

export interface SidebarItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  kind?: SidebarItemKind;
  label?: string;
  variant?: SidebarItemVariant;
}

export const SidebarItem = React.forwardRef<
  HTMLButtonElement,
  SidebarItemProps
>(
  (
    {
      active = false,
      className,
      icon,
      kind = "nav",
      label,
      type = "button",
      variant,
      ...props
    },
    ref
  ) => {
    const preset = variant ? sidebarItemVariantMap[variant] : undefined;
    const resolvedActive = preset?.active ?? active;
    const resolvedIcon = preset?.icon ?? icon;
    const resolvedKind = preset?.kind ?? kind;
    const resolvedLabel = preset?.label ?? label;
    const isProject = resolvedKind === "project";

    return (
      <button
        className={cn(
          "flex w-[216px] items-center gap-2 rounded-[10px] px-3 py-2 text-left transition-colors",
          "font-[var(--app-font-family-base)]",
          resolvedActive
            ? "border border-[var(--color-slate-800)] bg-[var(--color-ink-800)]"
            : "border border-transparent bg-[var(--color-ink-900)]",
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        ref={ref}
        type={type}
        {...props}
      >
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center",
            resolvedActive
              ? "text-[var(--app-color-brand-500)]"
              : "text-[var(--app-color-gray-500)]"
          )}
        >
          {resolvedIcon}
        </span>
        <span
          className={cn(
            "text-[14px] leading-[14px]",
            resolvedActive
              ? "font-[var(--app-font-weight-600)] text-[var(--app-color-white)]"
              : isProject
                ? "font-normal text-[var(--color-slate-400)]"
                : "font-[var(--app-font-weight-500)] text-[var(--color-slate-400)]"
          )}
        >
          {resolvedLabel}
        </span>
      </button>
    );
  }
);

SidebarItem.displayName = "SidebarItem";
