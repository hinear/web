"use client";

import * as React from "react";
import { MobileIssueListAppBar } from "@/components/molecules/MobileIssueListAppBar";
import { CreateIssueTabletModal } from "@/components/organisms/CreateIssueTabletModal";
import { LinearDashboardHeader } from "@/components/organisms/LinearDashboardHeader";
import { MobileIssueSections } from "@/components/organisms/MobileIssueSections";
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
}

export function KanbanBoardView({
  assigneeOptions,
  boardHref,
  createIssueAction,
  dashboardHref,
  projectId,
  projectKey,
  projectName = "Project",
}: KanbanBoardViewProps) {
  const { issues, loading, error, mutationError, updateIssue } =
    useIssues(projectId);
  const [createModalStatus, setCreateModalStatus] =
    React.useState<IssueStatus | null>(null);

  const boardErrorMessage = mutationError?.message ?? error?.message ?? null;

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
      {boardErrorMessage ? (
        <div
          className="rounded-[16px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-[#991B1B]"
          role="alert"
        >
          {boardErrorMessage}
        </div>
      ) : null}
      <div className="md:hidden">
        <div className="flex flex-col gap-4">
          <MobileIssueListAppBar title={projectName} />
          <MobileIssueSections issues={issues} />
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

        <div className="rounded-[12px] border border-[#DDD6FE] bg-[#F5F3FF] px-[14px] py-3 text-[12px] leading-5 font-[var(--app-font-weight-600)] text-[#5B21B6]">
          Exploration flow: card click opens the compact drawer. MVP 1 source of
          truth stays the full page detail route.
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <KanbanBoard
            issues={issues}
            onAddCard={setCreateModalStatus}
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
