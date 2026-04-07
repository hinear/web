import "server-only";

import Link from "next/link";

import { IssueDateMeta } from "@/features/issues/detail/components/IssueDateMeta";
import { IssueIdentifierBadge } from "@/features/issues/detail/components/IssueIdentifierBadge";
import { IssueStatusBadge } from "@/features/issues/detail/components/IssueStatusBadge";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import type { Issue } from "@/features/issues/types";
import { getIssuePath } from "@/features/projects/lib/project-routes";

interface ProjectOverviewContentProps {
  projectId: string;
}

export async function ProjectOverviewContent({
  projectId,
}: ProjectOverviewContentProps) {
  const issuesRepository = await getServerIssuesRepository();
  const issues = await issuesRepository.listIssuesByProject(projectId);

  const recentIssues = [...issues]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )
    .slice(0, 3);

  const summary = {
    backlogIssueCount: issues.filter((i) => i.status === "Backlog").length,
    doneIssueCount: issues.filter((i) => i.status === "Done").length,
    inProgressIssueCount: issues.filter((i) => i.status === "In Progress")
      .length,
    totalIssueCount: issues.length,
  };

  return (
    <>
      {/* Mobile stat cards */}
      <section className="grid grid-cols-2 gap-3 md:hidden">
        {getStatCards(summary).map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            tone={card.tone}
            value={card.value}
          />
        ))}
      </section>

      {/* Mobile recent activity */}
      <section className="flex flex-col gap-[10px] md:hidden">
        <h2 className="text-[14px] leading-[14px] font-[var(--app-font-weight-600)] text-[#111318]">
          Recent activity
        </h2>
        <RecentActivityList issues={recentIssues} projectId={projectId} />
      </section>

      {/* Desktop stat cards */}
      <section className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
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

      {/* Desktop recent activity */}
      <section className="hidden flex-col gap-[14px] md:flex">
        <h2 className="font-display text-[18px] leading-[18px] font-[var(--app-font-weight-600)] text-[#0D0D0D]">
          Recent Activity
        </h2>

        <div className="flex flex-col gap-3">
          {recentIssues.length > 0 ? (
            recentIssues.map((issue) => (
              <Link
                className="flex items-start gap-3 border border-[#E8E8E8] bg-white px-4 py-[14px] transition-colors hover:bg-[#F7F8FA]"
                href={getIssuePath(projectId, issue.id, { view: "full" })}
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
                    <IssueDateMeta value={issue.updatedAt} variant="relative" />
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
    </>
  );
}

function getStatCards(summary: {
  backlogIssueCount: number;
  doneIssueCount: number;
  inProgressIssueCount: number;
  totalIssueCount: number;
}) {
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

function StatCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: string;
  value: number;
}) {
  return (
    <article className="rounded-[14px] border border-[#E6E8EC] bg-white px-[14px] py-[14px]">
      <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[#6B7280]">
        {label}
      </p>
      <p
        className={`mt-[6px] text-[28px] leading-none font-[var(--app-font-weight-700)] ${tone}`}
      >
        {value}
      </p>
    </article>
  );
}

function RecentActivityList({
  issues,
  projectId,
}: {
  issues: Issue[];
  projectId: string;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      {issues.length > 0 ? (
        issues.map((issue) => (
          <Link
            className="rounded-[14px] border border-[#E6E8EC] bg-white px-[14px] py-[14px] transition-colors hover:bg-[#F7F8FA]"
            href={getIssuePath(projectId, issue.id, { view: "full" })}
            key={issue.id}
          >
            <p className="truncate text-[13px] leading-[1.35] font-[var(--app-font-weight-500)] text-[#111318]">
              {issue.identifier} {issue.title}
            </p>
            <p className="mt-1 text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[#6B7280]">
              <IssueDateMeta value={issue.updatedAt} variant="relative" />
            </p>
          </Link>
        ))
      ) : (
        <div className="rounded-[14px] border border-dashed border-[#D6DAE1] bg-white px-[14px] py-[14px] text-[13px] leading-[1.4] text-[#6B7280]">
          No recent activity yet.
        </div>
      )}
    </div>
  );
}
