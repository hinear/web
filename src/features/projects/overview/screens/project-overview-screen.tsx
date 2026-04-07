import { Settings } from "lucide-react";
import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";
import { SidebarItem } from "@/components/molecules/SidebarItem";
import { IssueDateMeta } from "@/features/issues/detail/components/IssueDateMeta";
import { IssueIdentifierBadge } from "@/features/issues/detail/components/IssueIdentifierBadge";
import { IssueStatusBadge } from "@/features/issues/detail/components/IssueStatusBadge";
import type { Issue } from "@/features/issues/types";
import {
  getIssuePath,
  getProfileSettingsPath,
  getProjectOverviewPath,
  getProjectPath,
} from "@/features/projects/lib/project-routes";
import { ProjectOverviewMobileHeader } from "@/features/projects/overview/components/project-overview-mobile-header";
import { ProjectOverviewMobileSwitcher } from "@/features/projects/overview/components/project-overview-mobile-switcher";
import { RecentActivityList } from "@/features/projects/overview/components/recent-activity-list";
import { StatCard } from "@/features/projects/overview/components/stat-card";
import type { Project } from "@/features/projects/types";

interface ProjectOverviewScreenProps {
  project: Project;
  projects: Project[];
  summary: {
    activeIssueCount: number;
    backlogIssueCount: number;
    doneIssueCount: number;
    inProgressIssueCount: number;
    memberCount: number;
    pendingInvitationCount: number;
    totalIssueCount: number;
  };
  issues?: Issue[];
}

function getStatCards(summary: ProjectOverviewScreenProps["summary"]) {
  return [
    {
      label: "Total issues",
      tone: "text-[#111318]",
      value: summary.totalIssueCount,
    },
    {
      label: "In progress",
      tone: "text-[#E42313]",
      value: summary.inProgressIssueCount,
    },
    {
      label: "Done",
      tone: "text-[#22C55E]",
      value: summary.doneIssueCount,
    },
    {
      label: "Backlog",
      tone: "text-[#111318]",
      value: summary.backlogIssueCount,
    },
  ];
}

export function ProjectOverviewScreen({
  issues = [],
  project,
  projects,
  summary,
}: ProjectOverviewScreenProps) {
  const recentIssues = [...issues]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )
    .slice(0, 3);
  const orderedProjects = projects.map((candidate) => ({
    active: candidate.id === project.id,
    href: getProjectOverviewPath(candidate.id),
    label: candidate.name,
  }));

  return (
    <main className="min-h-screen bg-[#FCFCFD] md:flex">
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
        <div className="app-mobile-page-shell flex w-full flex-col gap-4 px-4 py-4 md:hidden">
          <ProjectOverviewMobileHeader project={project} />
          <ProjectOverviewMobileSwitcher
            project={project}
            projects={projects}
          />

          <section className="grid grid-cols-2 gap-3">
            {getStatCards(summary).map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                tone={card.tone}
                value={card.value}
              />
            ))}
          </section>

          <section className="flex flex-col gap-[10px]">
            <h2 className="text-[14px] leading-[14px] font-[var(--app-font-weight-600)] text-[#111318]">
              Recent activity
            </h2>
            <RecentActivityList issues={recentIssues} projectId={project.id} />
          </section>
        </div>

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
                href={getProjectPath(project.id)}
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

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {getStatCards(summary).map((card) => (
              <article
                className="border border-[#E8E8E8] bg-white px-7 py-7"
                key={card.label}
              >
                <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[#6B7280]">
                  {card.label}
                </p>
                <p
                  className={`mt-2 text-[40px] leading-none font-[var(--app-font-weight-600)] ${card.tone}`}
                >
                  {card.value}
                </p>
              </article>
            ))}
          </section>

          <section className="flex flex-col gap-[14px]">
            <h2 className="font-display text-[18px] leading-[18px] font-[var(--app-font-weight-600)] text-[#0D0D0D]">
              Recent Activity
            </h2>

            <div className="flex flex-col gap-3">
              {recentIssues.length > 0 ? (
                recentIssues.map((issue) => (
                  <Link
                    className="flex items-start gap-3 border border-[#E8E8E8] bg-white px-4 py-[14px] transition-colors hover:bg-[#F7F8FA]"
                    href={getIssuePath(project.id, issue.id, { view: "full" })}
                    key={issue.id}
                  >
                    <IssueStatusBadge
                      className="mt-[2px] shrink-0"
                      size="sm"
                      status={issue.status}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <IssueIdentifierBadge
                          identifier={issue.identifier}
                          size="sm"
                        />
                        <p className="min-w-0 truncate text-[13px] leading-[1.35] font-[var(--app-font-weight-600)] text-[#111318]">
                          {issue.title}
                        </p>
                      </div>
                      <p className="text-[11px] leading-[11px] text-[#6B7280]">
                        <IssueDateMeta
                          value={issue.updatedAt}
                          variant="relative"
                        />
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="border border-[#E8E8E8] bg-white px-4 py-[14px] text-[13px] leading-[1.4] text-[#6B7280]">
                  No recent activity yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
