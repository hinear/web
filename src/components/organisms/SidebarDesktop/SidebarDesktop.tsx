import * as React from "react";

import {
  OpenDashboardLink,
  ProjectSwitcher,
} from "@/components/molecules/ProjectSelect";
import {
  SidebarItem,
  type SidebarItemVariant,
} from "@/components/molecules/SidebarItem";
import { cn } from "@/lib/utils";

export interface SidebarDesktopProps
  extends React.HTMLAttributes<HTMLDivElement> {
  appName?: string;
  dashboardLabel?: string;
  projectLabel?: string;
  projectSubtitle?: string;
  projectTitle?: string;
  primaryNavigation?: SidebarItemVariant[];
}

const defaultPrimaryNavigation: SidebarItemVariant[] = [
  "issues",
  "triage",
  "active",
  "backlog",
];

export const SidebarDesktop = React.forwardRef<
  HTMLDivElement,
  SidebarDesktopProps
>(
  (
    {
      appName = "Hinear",
      className,
      dashboardLabel = "Open dashboard",
      primaryNavigation = defaultPrimaryNavigation,
      projectLabel = "Project",
      projectSubtitle = "Personal Project",
      projectTitle = "Web App",
      ...props
    },
    ref
  ) => {
    return (
      <aside
        className={cn(
          "flex min-h-[900px] w-[240px] flex-col gap-7 border-r border-[var(--color-ink-850)] bg-[var(--color-ink-900)] px-4 pt-6 pb-6 font-[var(--app-font-family-base)]",
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-[var(--app-color-brand-500)]" />
          <span className="text-[16px] leading-[16px] font-[var(--app-font-weight-600)] text-[var(--app-color-white)]">
            {appName}
          </span>
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-[10px]">
            <ProjectSwitcher
              defaultProjects={[]}
              label={projectLabel}
              subtitle={projectSubtitle}
              title={projectTitle}
            />
            <OpenDashboardLink label={dashboardLabel} />
          </div>

          <div className="flex w-full flex-col gap-1">
            {primaryNavigation.map((item) => (
              <SidebarItem className="w-full" key={item} variant={item} />
            ))}
          </div>
        </div>
      </aside>
    );
  }
);

SidebarDesktop.displayName = "SidebarDesktop";
