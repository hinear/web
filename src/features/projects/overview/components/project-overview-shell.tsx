import { ChevronDown, Settings } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { getButtonClassName } from "@/components/atoms/Button";
import { SidebarItem } from "@/components/molecules/SidebarItem";
import {
  getProfileSettingsPath,
  getProjectOverviewPath,
} from "@/features/projects/lib/project-routes";
import type { Project } from "@/features/projects/types";

interface ProjectOverviewShellProps {
  children: ReactNode;
  project: Project;
  projects: Project[];
}

export function ProjectOverviewShell({
  children,
  project,
  projects,
}: ProjectOverviewShellProps) {
  const orderedProjects = projects.map((candidate) => ({
    active: candidate.id === project.id,
    href: getProjectOverviewPath(candidate.id),
    label: candidate.name,
  }));

  return (
    <main className="min-h-screen bg-[#FCFCFD] md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] shrink-0 border-r border-[#1C1F26] bg-[#111318] px-4 pt-6 pb-6 md:flex md:flex-col md:gap-7">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-[#5E6AD2]" />
          <span className="text-[16px] leading-[16px] font-[var(--app-font-weight-600)] text-white">
            Hinear
          </span>
        </div>

        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
              Projects
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {orderedProjects.map((candidate) => (
              <SidebarItem
                active={candidate.active}
                className="w-full"
                href={candidate.href}
                key={candidate.href}
                kind="project"
                label={candidate.label}
              />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-1 pt-4">
            <Link
              className={getButtonClassName("ghost", "sm")}
              href="/projects/new"
            >
              + New Project
            </Link>
            <SidebarItem
              className="w-full"
              href={getProfileSettingsPath()}
              icon={<Settings className="h-4 w-4" />}
              label="Profile settings"
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-[#FCFCFD]">
        {/* Mobile shell */}
        <div className="app-mobile-page-shell flex w-full flex-col gap-4 px-4 py-4 md:hidden">
          <ProjectOverviewMobileHeader project={project} />
          <ProjectOverviewMobileSwitcher
            project={project}
            projects={projects}
          />
          {children}
        </div>

        {/* Desktop shell */}
        <div className="hidden w-full flex-col gap-6 p-6 md:flex">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[#6B7280]">
                {project.name}
              </p>
              <h1 className="text-[22px] leading-[1.1] font-[var(--app-font-weight-600)] text-[#111318]">
                {project.name}
              </h1>
              <p className="text-[13px] leading-[1.4] text-[#6B7280]">
                {project.type === "team" ? "Team Project" : "Personal Project"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                className={getButtonClassName("secondary", "sm")}
                href={`/projects/${project.id}`}
              >
                Open Project
              </Link>
              <Link
                className={getButtonClassName("secondary", "sm")}
                href={getProfileSettingsPath()}
              >
                Profile settings
              </Link>
            </div>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}

function ProjectOverviewMobileHeader({ project }: { project: Project }) {
  return (
    <div
      className="app-mobile-top-surface flex items-center justify-between gap-3"
      data-testid="project-overview-mobile-header"
    >
      <div className="min-w-0">
        <h1 className="truncate text-[18px] leading-[18px] font-[var(--app-font-weight-600)] text-[#111318]">
          {project.name}
        </h1>
        <p className="mt-[2px] truncate text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[#6B7280]">
          Overview
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          className={getButtonClassName("secondary", "sm")}
          href={`/projects/${project.id}`}
        >
          Open Project
        </Link>
        <Link
          aria-label="Profile settings"
          className={getButtonClassName(
            "secondary",
            "sm",
            "app-mobile-touch-target h-[34px] w-[34px] rounded-[10px] px-0 py-0"
          )}
          href={getProfileSettingsPath()}
        >
          <Settings aria-hidden="true" className="h-[14px] w-[14px]" />
        </Link>
      </div>
    </div>
  );
}

function ProjectOverviewMobileSwitcher({
  project,
  projects,
}: {
  project: Project;
  projects: Project[];
}) {
  return (
    <details className="group rounded-[12px] border border-[#E6E8EC] bg-white">
      <summary className="flex list-none items-center justify-between gap-3 px-3 py-[10px] marker:content-none">
        <div className="min-w-0">
          <p className="text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[#6B7280]">
            Project
          </p>
          <p className="mt-[2px] truncate text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[#111318]">
            {project.name}
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[#6B7280] transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-[#E6E8EC] px-2 py-2">
        <div className="flex flex-col gap-1">
          {projects.map((candidate) => (
            <Link
              className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                candidate.id === project.id
                  ? "bg-[#F3F4F6] font-[var(--app-font-weight-600)] text-[#111318]"
                  : "font-[var(--app-font-weight-500)] text-[#4B5563]"
              }`}
              href={getProjectOverviewPath(candidate.id)}
              key={candidate.id}
            >
              {candidate.name}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
