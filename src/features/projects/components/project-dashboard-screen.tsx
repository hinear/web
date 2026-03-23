import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";
import { SidebarItem } from "@/components/molecules/SidebarItem";
import type { Issue } from "@/features/issues/types";
import {
  getIssuePath,
  getProjectPath,
  getProjectSettingsPath,
} from "@/features/projects/lib/paths";
import type { Project } from "@/features/projects/types";

interface ProjectDashboardScreenProps {
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

function formatUpdatedAt(value: string) {
  const diffInHours = Math.round(
    (new Date(value).getTime() - Date.now()) / (1000 * 60 * 60)
  );

  if (Math.abs(diffInHours) < 24) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      diffInHours,
      "hour"
    );
  }

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round(diffInHours / 24),
    "day"
  );
}

function getIssueStatusTone(status: Issue["status"]) {
  switch (status) {
    case "Done":
      return "bg-[#22C55E]";
    case "In Progress":
      return "bg-[#E42313]";
    case "Backlog":
      return "bg-[#6B7280]";
    default:
      return "bg-[#9CA3AF]";
  }
}

function getStatCards(summary: ProjectDashboardScreenProps["summary"]) {
  return [
    {
      label: "Total Issues",
      tone: "text-[#111318]",
      value: summary.totalIssueCount,
    },
    {
      label: "In Progress",
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

export function ProjectDashboardScreen({
  issues = [],
  project,
  projects,
  summary,
}: ProjectDashboardScreenProps) {
  const recentIssues = [...issues]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )
    .slice(0, 3);
  const orderedProjects = projects.map((candidate) => ({
    active: candidate.id === project.id,
    href: getProjectDashboardPath(candidate.id),
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
              href={getProjectSettingsPath(project.id)}
              variant="settings"
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-[#FCFCFD]">
        <div className="flex w-full flex-col gap-6 p-6">
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
                href="/projects/new"
              >
                + New Project
              </Link>
              <Link
                className={getButtonClassName("secondary", "sm")}
                href={getProjectPath(project.id)}
              >
                Open board
              </Link>
              <Link
                className={getButtonClassName("secondary", "sm")}
                href={getProjectSettingsPath(project.id)}
              >
                Settings
              </Link>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#DDD6FE] bg-[#F5F3FF] px-[14px] py-3 text-[12px] leading-5 font-[var(--app-font-weight-600)] text-[#5B21B6]">
            Exploration only. Project Dashboard is separated from the MVP 1
            implementation scope.
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
                    href={getIssuePath(project.id, issue.id)}
                    key={issue.id}
                  >
                    <span
                      className={`mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full ${getIssueStatusTone(issue.status)}`}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="truncate text-[13px] leading-[1.35] font-[var(--app-font-weight-600)] text-[#111318]">
                        {issue.identifier} {issue.title}
                      </p>
                      <p className="text-[11px] leading-[11px] text-[#6B7280]">
                        {formatUpdatedAt(issue.updatedAt)}
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

function getProjectDashboardPath(projectId: string) {
  return `/projects/${projectId}/dashboard`;
}
