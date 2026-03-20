import { ChevronDown, Folder, LayoutDashboard } from "lucide-react";
import * as React from "react";
import { SidebarItem } from "@/components/molecules/SidebarItem";
import { cn } from "@/lib/utils";

export interface ProjectSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  subtitle: string;
  title: string;
}

export interface ProjectSwitcherProps {
  defaultProjects?: Array<{
    active?: boolean;
    label: string;
  }>;
  label?: string;
  open?: boolean;
  subtitle: string;
  title: string;
}

export interface OpenDashboardLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const ProjectSelect = React.forwardRef<
  HTMLButtonElement,
  ProjectSelectProps
>(({ className, subtitle, title, type = "button", ...props }, ref) => {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-between rounded-[12px] border border-[var(--color-slate-850)] bg-[var(--color-ink-875)] px-3 py-[10px] text-left",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    >
      <span className="flex min-w-0 flex-col gap-[2px]">
        <span className="truncate text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-white)]">
          {title}
        </span>
        <span className="truncate text-[11px] leading-[11px] font-normal text-[var(--color-slate-400)]">
          {subtitle}
        </span>
      </span>
      <ChevronDown
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-[var(--app-color-gray-500)]"
      />
    </button>
  );
});

ProjectSelect.displayName = "ProjectSelect";

export function ProjectSwitcher({
  defaultProjects = [
    { active: true, label: "Web App" },
    { label: "Mobile App" },
  ],
  label = "Project",
  open = true,
  subtitle,
  title,
}: ProjectSwitcherProps) {
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
        {label}
      </span>
      <ProjectSelect subtitle={subtitle} title={title} />
      {open ? (
        <div className="flex flex-col gap-1">
          {defaultProjects.map((project) => (
            <SidebarItem
              className="w-full"
              key={project.label}
              active={project.active}
              icon={<Folder className="h-4 w-4" />}
              kind="project"
              label={project.label}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const OpenDashboardLink = React.forwardRef<
  HTMLButtonElement,
  OpenDashboardLinkProps
>(({ className, label = "Open dashboard", type = "button", ...props }, ref) => {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-[10px] bg-[var(--color-ink-900)] px-[10px] py-2 text-left",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    >
      <LayoutDashboard className="h-[14px] w-[14px] shrink-0 text-[var(--color-slate-400)]" />
      <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-350)]">
        {label}
      </span>
    </button>
  );
});

OpenDashboardLink.displayName = "OpenDashboardLink";
