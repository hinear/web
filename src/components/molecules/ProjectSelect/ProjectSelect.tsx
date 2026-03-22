"use client";

import { ChevronDown, Folder, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { SidebarItem } from "@/components/molecules/SidebarItem";
import { cn } from "@/lib/utils";

export interface ProjectSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  expanded?: boolean;
  href?: string;
  subtitle: string;
  title: string;
}

export interface ProjectSwitcherProps {
  defaultProjects?: Array<{
    active?: boolean;
    href?: string;
    label: string;
  }>;
  label?: string;
  open?: boolean;
  subtitle: string;
  title: string;
}

export interface OpenDashboardLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  label?: string;
}

export const ProjectSelect = React.forwardRef<
  HTMLButtonElement,
  ProjectSelectProps
>(
  (
    {
      className,
      expanded = false,
      href,
      subtitle,
      title,
      type = "button",
      ...props
    },
    ref
  ) => {
    const classNames = cn(
      "flex w-full items-center justify-between rounded-[12px] border border-[var(--color-slate-850)] bg-[var(--color-ink-875)] px-3 py-[10px] text-left",
      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    );
    const content = (
      <>
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
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--app-color-gray-500)] transition-transform",
            expanded ? "rotate-180" : ""
          )}
        />
      </>
    );

    if (href) {
      return (
        <Link className={classNames} href={href}>
          {content}
        </Link>
      );
    }

    return (
      <button className={classNames} ref={ref} type={type} {...props}>
        {content}
      </button>
    );
  }
);

ProjectSelect.displayName = "ProjectSelect";

export function ProjectSwitcher({
  defaultProjects = [
    { active: true, label: "Web App" },
    { label: "Mobile App" },
  ],
  label = "Project",
  open = false,
  subtitle,
  title,
}: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(open);

  return (
    <div className="flex w-full flex-col gap-[10px]">
      <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
        {label}
      </span>
      <ProjectSelect
        aria-expanded={isOpen}
        expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        subtitle={subtitle}
        title={title}
      />
      {isOpen ? (
        <div className="flex flex-col gap-1">
          {defaultProjects.map((project) => (
            <SidebarItem
              className="w-full"
              key={project.label}
              active={project.active}
              href={project.href}
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
>(
  (
    { className, href, label = "Open dashboard", type = "button", ...props },
    ref
  ) => {
    const classNames = cn(
      "flex w-full items-center gap-2 rounded-[10px] bg-[var(--color-ink-900)] px-[10px] py-2 text-left",
      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    );
    const content = (
      <>
        <LayoutDashboard className="h-[14px] w-[14px] shrink-0 text-[var(--color-slate-400)]" />
        <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--color-slate-300)]">
          {label}
        </span>
      </>
    );

    if (href) {
      return (
        <Link className={classNames} href={href}>
          {content}
        </Link>
      );
    }

    return (
      <button className={classNames} ref={ref} type={type} {...props}>
        {content}
      </button>
    );
  }
);

OpenDashboardLink.displayName = "OpenDashboardLink";
