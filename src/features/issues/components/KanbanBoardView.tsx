"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Chip } from "@/components/atoms/Chip";
import { MobileIssueListAppBar } from "@/components/molecules/MobileIssueListAppBar";
import { CreateIssueTabletModal } from "@/components/organisms/CreateIssueTabletModal";
import { LinearDashboardHeader } from "@/components/organisms/LinearDashboardHeader";
import { MobileIssueSections } from "@/components/organisms/MobileIssueSections";
import { getProjectIssueCreatePath } from "@/features/projects/lib/project-routes";
import type { IssueStatus } from "@/specs/issue-detail.contract";
import { useIssues } from "../hooks/useIssues";
import { KanbanBoard } from "./KanbanBoard";

interface KanbanBoardViewProps {
  assigneeOptions?: Array<{
    label: string;
    value: string;
  }>;
  boardHref?: string;
  createIssueAction?: React.ComponentProps<"form">["action"];
  dashboardHref?: string;
  projectId: string;
  projectKey?: string;
  projectName?: string;
  projectOptions?: Array<{
    active?: boolean;
    href?: string;
    label: string;
  }>;
}

function MobileProjectSwitcher({
  projectName,
  projectOptions = [],
}: {
  projectName: string;
  projectOptions?: Array<{
    active?: boolean;
    href?: string;
    label: string;
  }>;
}) {
  return (
    <details className="group rounded-[12px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)]">
      <summary className="flex list-none items-center justify-between gap-3 px-3 py-[10px] marker:content-none">
        <div className="min-w-0">
          <p className="text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
            Project
          </p>
          <p className="mt-[2px] truncate text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
            {projectName}
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--app-color-gray-500)] transition-transform group-open:rotate-180"
        />
      </summary>

      {projectOptions.length > 0 ? (
        <div className="border-t border-[var(--app-color-border-soft)] px-2 py-2">
          <div className="flex flex-col gap-1">
            {projectOptions.map((project) =>
              project.href ? (
                <Link
                  className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                    project.active
                      ? "bg-[var(--app-color-gray-100)] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]"
                      : "font-[var(--app-font-weight-500)] text-[#4B5563]"
                  }`}
                  href={project.href}
                  key={project.href}
                >
                  {project.label}
                </Link>
              ) : (
                <div
                  className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                    project.active
                      ? "bg-[var(--app-color-gray-100)] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]"
                      : "font-[var(--app-font-weight-500)] text-[#4B5563]"
                  }`}
                  key={project.label}
                >
                  {project.label}
                </div>
              )
            )}
          </div>
        </div>
      ) : null}
    </details>
  );
}

function MobileIssueFilterChips() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip size="sm" variant="accent">
        Updated
      </Chip>
      <Chip size="sm" variant="neutral">
        My issues
      </Chip>
      <Chip size="sm" variant="neutral">
        Filter
      </Chip>
    </div>
  );
}

export function KanbanBoardView({
  assigneeOptions,
  boardHref,
  createIssueAction,
  dashboardHref,
  projectId,
  projectKey,
  projectName = "Project",
  projectOptions,
}: KanbanBoardViewProps) {
  const router = useRouter();
  const { issues, loading, error, mutationError, updateIssue } =
    useIssues(projectId);
  const [createModalStatus, setCreateModalStatus] =
    React.useState<IssueStatus | null>(null);

  const boardErrorMessage = mutationError?.message ?? error?.message ?? null;

  // Show toast on mutation error
  React.useEffect(() => {
    if (mutationError) {
      toast.error("We couldn't update the board. Try again.");
    }
  }, [mutationError]);

  React.useEffect(() => {
    if (!createModalStatus) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCreateModalStatus(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createModalStatus]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-[var(--border)] bg-[#F7F8FA] px-6 py-10">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#D6DAF8] border-t-[var(--app-color-brand-500)]" />
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
              Loading board
            </p>
            <p className="text-[16px] font-semibold text-[#111318]">
              Fetching the latest issues for {projectName}.
            </p>
            <p className="text-[13px] font-medium text-[#6B7280]">
              Cards and counts will appear as soon as the project data is ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-[#FCA5A5] bg-[#FEF2F2] p-5 text-[#991B1B] shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Board unavailable
          </p>
          <p className="text-base font-semibold">
            We couldn&apos;t load the {projectName} board right now.
          </p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-full flex-col gap-6">
      <div className="md:hidden">
        <div className="flex flex-col gap-4">
          <MobileIssueListAppBar
            onCreateClick={() =>
              router.push(getProjectIssueCreatePath(projectId))
            }
            title={projectName}
          />
          <MobileProjectSwitcher
            projectName={projectName}
            projectOptions={projectOptions}
          />
          <MobileIssueFilterChips />
          <MobileIssueSections
            issues={issues}
            projectId={projectId}
            statuses={[
              "Triage",
              "In Progress",
              "Done",
              "Backlog",
              "Todo",
              "Canceled",
            ]}
          />
        </div>
      </div>
      <div className="hidden min-h-0 flex-1 flex-col gap-5 md:flex">
        <LinearDashboardHeader
          boardHref={boardHref}
          dashboardHref={dashboardHref}
          eyebrow={`${projectName} / ${projectKey ?? "PRJ"}`}
          issues={issues}
          onCreateClick={() => setCreateModalStatus("Triage")}
          subtitle="Focused view of triage, build, and shipped work."
          title="Issue board"
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <KanbanBoard
            assigneeOptions={assigneeOptions ?? []}
            issues={issues}
            onAddCard={setCreateModalStatus}
            onNavigate={(href) => router.push(href)}
            onIssueUpdate={updateIssue}
            projectId={projectId}
          />
        </div>
      </div>

      {createModalStatus ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10">
          <button
            aria-label="Close issue create modal"
            className="absolute inset-0 bg-[rgba(15,23,42,0.36)]"
            onClick={() => setCreateModalStatus(null)}
            type="button"
          />
          <CreateIssueTabletModal
            action={createIssueAction}
            assigneeOptions={assigneeOptions}
            className="relative z-10 max-h-[calc(100vh-80px)] overflow-y-auto"
            defaultStatus={createModalStatus}
            onClick={(event) => event.stopPropagation()}
            onCancel={() => setCreateModalStatus(null)}
            onClose={() => setCreateModalStatus(null)}
          />
        </div>
      ) : null}
    </div>
  );
}
