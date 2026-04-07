"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { ConflictDialog } from "@/components/molecules/ConflictDialog";
import { DueDateField } from "@/components/molecules/DueDateField";
import { LabelSelector } from "@/components/molecules/LabelSelector";
import { IssueActivityItem } from "@/features/issues/detail/components/IssueActivityItem";
import { IssueDateMeta } from "@/features/issues/detail/components/IssueDateMeta";
import { IssueFieldBlock } from "@/features/issues/detail/components/IssueFieldBlock";
import { IssueMetaRow } from "@/features/issues/detail/components/IssueMetaRow";
import { IssuePanel } from "@/features/issues/detail/components/IssuePanel";
import { IssueSectionHeader } from "@/features/issues/detail/components/IssueSectionHeader";
import { useIssueDrawerEditor } from "@/features/issues/detail/hooks/use-issue-drawer-editor";
import { IssueAssigneePill } from "@/features/issues/shared/components/IssueAssigneePill";
import { IssueEmptyState } from "@/features/issues/shared/components/IssueEmptyState";
import type { ActivityLogEntry, Issue, Label } from "@/features/issues/types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";

interface IssueDetailDrawerScreenProps {
  activityLog?: ActivityLogEntry[];
  availableLabels?: Label[];
  assigneeOptions: Array<{
    label: string;
    value: string;
  }>;
  boardHref: string;
  createdByName?: string;
  fullPageHref: string;
  issue: Issue;
  lastEditedByName?: string;
  memberNamesById?: Record<string, string>;
  onClose?: () => void;
}

const MarkdownEditor = dynamic(
  () =>
    import("@/components/molecules/MarkdownEditor").then((module) => ({
      default: module.MarkdownEditor,
    })),
  {
    loading: () => (
      <div className="min-h-[160px] animate-pulse rounded-[12px] border border-[#E6E8EC] bg-[#F8FAFC]" />
    ),
    ssr: false,
  }
);

export function IssueDetailDrawerScreen({
  activityLog,
  availableLabels,
  assigneeOptions,
  boardHref,
  createdByName,
  fullPageHref,
  issue,
  lastEditedByName,
  memberNamesById = {},
  onClose,
}: IssueDetailDrawerScreenProps) {
  const {
    assigneeDraft,
    availableLabels: resolvedLabels,
    conflictInfo,
    descriptionDraft,
    dismissConflict,
    dueDateDraft,
    handleCreateLabel,
    handleLabelToggle,
    hasPendingChanges,
    isSaving,
    issueState,
    now,
    priorityDraft,
    saveChanges,
    selectedLabelIds,
    setAssigneeDraft,
    setDescriptionDraft,
    setDueDateDraft,
    setPriorityDraft,
    setStatusDraft,
    setTitleDraft,
    statusDraft,
    titleDraft,
    visibleActivity,
  } = useIssueDrawerEditor({ activityLog, availableLabels, issue });

  return (
    <aside className="pointer-events-auto my-6 mr-6 flex h-[calc(100vh-48px)] w-full flex-col gap-4 overflow-hidden rounded-[16px] border border-[#E6E8EC] bg-white p-6 shadow-[0_0_60px_-12px_rgba(15,23,42,0.25)]">
      {conflictInfo ? (
        <ConflictDialog
          currentVersion={conflictInfo.currentVersion}
          onDismiss={dismissConflict}
          requestedVersion={conflictInfo.requestedVersion}
        />
      ) : null}

      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[20px] leading-[20px] font-[var(--app-font-weight-700)] text-[#111318]">
            Issue Drawer
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            className="rounded-[10px] bg-[#EEF2FF] px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[#4338CA]"
            href={fullPageHref}
          >
            Open full page
          </Link>
          {onClose ? (
            <button
              onClick={onClose}
              className="rounded-[10px] border border-[#E6E8EC] bg-white px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
              type="button"
            >
              Close
            </button>
          ) : (
            <Link
              className="rounded-[10px] border border-[#E6E8EC] bg-white px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
              href={boardHref}
            >
              Close
            </Link>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <IssuePanel className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[#5E6AD2]">
              {issueState.identifier}
            </span>
            <span className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              {isSaving ? "Saving..." : "Inline edit"}
            </span>
          </div>

          <label className="sr-only" htmlFor="drawer-issue-title">
            Title
          </label>
          <Field
            className="h-auto border-0 bg-transparent px-0 text-[28px] leading-[1.15] font-[var(--app-font-weight-700)] text-[#111318] focus-visible:ring-0"
            id="drawer-issue-title"
            onChange={(event) => setTitleDraft(event.target.value)}
            value={titleDraft}
          />

          <div className="grid grid-cols-2 gap-4">
            <IssueFieldBlock
              htmlFor="drawer-status"
              label="Status"
              labelClassName="font-[var(--app-font-weight-600)]"
            >
              <Select
                id="drawer-status"
                onValueChange={(value) =>
                  setStatusDraft(value as Issue["status"])
                }
                value={statusDraft}
              >
                {ISSUE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </IssueFieldBlock>

            <IssueFieldBlock
              htmlFor="drawer-priority"
              label="Priority"
              labelClassName="font-[var(--app-font-weight-600)]"
            >
              <Select
                id="drawer-priority"
                onValueChange={(value) =>
                  setPriorityDraft(value as Issue["priority"])
                }
                value={priorityDraft}
              >
                {ISSUE_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </IssueFieldBlock>

            <IssueFieldBlock
              htmlFor="drawer-assignee"
              label="Assignee"
              labelClassName="font-[var(--app-font-weight-600)]"
            >
              <Select
                id="drawer-assignee"
                onValueChange={setAssigneeDraft}
                value={assigneeDraft}
              >
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </IssueFieldBlock>

            <DueDateField
              id="drawer-dueDate"
              label="Due Date"
              value={dueDateDraft}
              onChange={setDueDateDraft}
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <span className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              Labels
            </span>
            <LabelSelector
              availableLabels={resolvedLabels.map((label) => ({
                color: label.color,
                id: label.id,
                name: label.name,
              }))}
              disabled={isSaving}
              onCreateLabel={handleCreateLabel}
              onLabelToggle={handleLabelToggle}
              placeholder="Select labels"
              selectedLabelIds={selectedLabelIds}
            />
          </div>
        </IssuePanel>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] leading-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
              Short description
            </h3>
            <span className="rounded-full bg-[#F3F4F6] px-[10px] py-[6px] text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              Compact
            </span>
          </div>

          <MarkdownEditor
            issueId={issueState.id}
            value={descriptionDraft}
            onChange={setDescriptionDraft}
            placeholder="이슈에 대한 자세한 설명을 작성해주세요..."
            minHeight="160px"
            projectId={issueState.projectId}
          />
        </section>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <IssueSectionHeader
            badge={
              <Link
                className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[#4338CA]"
                href={fullPageHref}
              >
                View full history
              </Link>
            }
            title="Recent activity"
            titleClassName="text-[14px] leading-[14px] font-[var(--app-font-weight-700)]"
          />

          <div className="flex flex-col gap-2">
            {visibleActivity.length > 0 ? (
              visibleActivity.map((entry) => (
                <IssueActivityItem
                  actorLabel={memberNamesById[entry.actorId] ?? entry.actorId}
                  className="rounded-[12px] bg-[#FCFCFD] px-[14px] py-3"
                  key={entry.id}
                  createdAt={entry.createdAt}
                  dateLocale="ko-KR"
                  dateVariant="relative"
                  now={now}
                  summary={entry.summary}
                />
              ))
            ) : (
              <IssueEmptyState
                className="rounded-[12px] bg-[#FCFCFD] px-[14px] py-3 text-[12px] leading-[1.45] text-[#6B7280]"
                message="No recent activity."
              />
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <IssueSectionHeader
            badge={
              <span className="rounded-full bg-[#F3F4F6] px-[10px] py-[6px] text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
                Compact
              </span>
            }
            title="Metadata"
            titleClassName="text-[14px] leading-[14px] font-[var(--app-font-weight-700)]"
          />

          <div className="flex flex-col gap-3">
            <IssueMetaRow
              label="Created"
              value={
                <IssueDateMeta value={issueState.createdAt} variant="compact" />
              }
            />
            <IssueMetaRow
              label="Updated"
              value={
                <IssueDateMeta
                  locale="ko-KR"
                  now={now}
                  value={issueState.updatedAt}
                  variant="relative"
                />
              }
            />
            <IssueMetaRow
              label="Assignee"
              value={
                <IssueAssigneePill
                  name={
                    assigneeOptions.find(
                      (option) => option.value === assigneeDraft
                    )?.label ?? "Unassigned"
                  }
                  size="sm"
                />
              }
            />
            <IssueMetaRow label="Author" value={createdByName ?? "Unknown"} />
            <IssueMetaRow
              label="Last editor"
              value={lastEditedByName ?? createdByName ?? "Unknown"}
            />
          </div>
        </section>
      </div>

      <footer className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#6B7280]">
            Scroll inside this drawer for more. Full page remains the source of
            truth for deeper edits and comment history.
          </p>
          <Link
            className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[#4338CA]"
            href={fullPageHref}
          >
            Open full page to comment
          </Link>
        </div>
        <Button
          disabled={isSaving || !hasPendingChanges}
          loading={isSaving}
          onClick={saveChanges}
          size="sm"
        >
          Save changes
        </Button>
      </footer>
    </aside>
  );
}
