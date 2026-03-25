"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { ConflictDialog } from "@/components/molecules/ConflictDialog";
import { DueDateField } from "@/components/molecules/DueDateField";
import { MarkdownEditor } from "@/components/molecules/MarkdownEditor";
import {
  getMutationErrorCode,
  getMutationErrorFallbackMessage,
  getMutationErrorMessage,
} from "@/features/issues/lib/mutation-error-messages";
import type {
  ActivityLogEntry,
  ConflictError,
  Issue,
} from "@/features/issues/types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";

interface IssueDetailDrawerScreenProps {
  activityLog?: ActivityLogEntry[];
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

interface IssueUpdateResponse {
  activityLog: ActivityLogEntry[];
  issue: Issue;
}

const EMPTY_ACTIVITY_LOG: ActivityLogEntry[] = [];

function isIssueUpdateResponse(value: unknown): value is IssueUpdateResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "issue" in value &&
      "activityLog" in value
  );
}

function isConflictError(value: unknown): value is ConflictError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      value.type === "CONFLICT" &&
      "currentIssue" in value
  );
}

function formatRelativeTime(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  return rtf.format(Math.round(diffHours / 24), "day");
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function IssueDetailDrawerScreen({
  activityLog = EMPTY_ACTIVITY_LOG,
  assigneeOptions,
  boardHref,
  createdByName,
  fullPageHref,
  issue,
  lastEditedByName,
  memberNamesById = {},
  onClose,
}: IssueDetailDrawerScreenProps) {
  const [issueState, setIssueState] = useState(issue);
  const [activityState, setActivityState] = useState(activityLog);
  const [titleDraft, setTitleDraft] = useState(issue.title);
  const [descriptionDraft, setDescriptionDraft] = useState(issue.description);
  const [statusDraft, setStatusDraft] = useState(issue.status);
  const [priorityDraft, setPriorityDraft] = useState(issue.priority);
  const [assigneeDraft, setAssigneeDraft] = useState(issue.assigneeId ?? "");
  const [dueDateDraft, setDueDateDraft] = useState(issue.dueDate);
  const [conflictInfo, setConflictInfo] = useState<{
    currentVersion: number;
    requestedVersion: number;
  } | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  useEffect(() => {
    setIssueState(issue);
    setActivityState(activityLog);
    setTitleDraft(issue.title);
    setDescriptionDraft(issue.description);
    setStatusDraft(issue.status);
    setPriorityDraft(issue.priority);
    setAssigneeDraft(issue.assigneeId ?? "");
    setDueDateDraft(issue.dueDate);
  }, [activityLog, issue]);

  const hasPendingChanges =
    titleDraft.trim() !== issueState.title ||
    descriptionDraft !== issueState.description ||
    statusDraft !== issueState.status ||
    priorityDraft !== issueState.priority ||
    assigneeDraft.trim() !== (issueState.assigneeId ?? "") ||
    dueDateDraft !== issueState.dueDate;

  function saveChanges() {
    setConflictInfo(null);

    startSavingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/issues/${issueState.id}/detail`,
          {
            body: JSON.stringify({
              assigneeId: assigneeDraft.trim() || null,
              description: descriptionDraft,
              dueDate: dueDateDraft,
              priority: priorityDraft,
              status: statusDraft,
              title: titleDraft.trim(),
              version: issueState.version,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "PATCH",
          }
        );
        const data = (await response.json()) as unknown;

        if (!response.ok) {
          if (response.status === 409 && isConflictError(data)) {
            setIssueState(data.currentIssue);
            setTitleDraft(data.currentIssue.title);
            setDescriptionDraft(data.currentIssue.description);
            setStatusDraft(data.currentIssue.status);
            setPriorityDraft(data.currentIssue.priority);
            setAssigneeDraft(data.currentIssue.assigneeId ?? "");
            setDueDateDraft(data.currentIssue.dueDate);
            setConflictInfo({
              currentVersion: data.currentVersion,
              requestedVersion: data.requestedVersion,
            });
            return;
          }

          throw new Error(
            getMutationErrorMessage({
              actionLabel: "issue",
              code: getMutationErrorCode(data),
              fallbackMessage: getMutationErrorFallbackMessage(data),
              status: response.status,
            })
          );
        }

        if (!isIssueUpdateResponse(data)) {
          throw new Error("Invalid issue update response.");
        }

        setIssueState(data.issue);
        setActivityState(data.activityLog);
        setTitleDraft(data.issue.title);
        setDescriptionDraft(data.issue.description);
        setStatusDraft(data.issue.status);
        setPriorityDraft(data.issue.priority);
        setAssigneeDraft(data.issue.assigneeId ?? "");
        setDueDateDraft(data.issue.dueDate);
        toast.success("Drawer changes saved.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save drawer changes."
        );
      }
    });
  }

  const visibleActivity = activityState.slice(0, 3);

  return (
    <aside className="pointer-events-auto my-6 mr-6 flex h-[calc(100vh-48px)] w-full flex-col gap-4 overflow-hidden rounded-[16px] border border-[#E6E8EC] bg-white p-6 shadow-[0_0_60px_-12px_rgba(15,23,42,0.25)]">
      {conflictInfo ? (
        <ConflictDialog
          currentVersion={conflictInfo.currentVersion}
          onDismiss={() => setConflictInfo(null)}
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
        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
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
            <div className="flex flex-col gap-[6px]">
              <label
                className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
                htmlFor="drawer-status"
              >
                Status
              </label>
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
            </div>

            <div className="flex flex-col gap-[6px]">
              <label
                className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
                htmlFor="drawer-priority"
              >
                Priority
              </label>
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
            </div>

            <div className="flex flex-col gap-[6px]">
              <label
                className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
                htmlFor="drawer-assignee"
              >
                Assignee
              </label>
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
            </div>

            <DueDateField
              id="drawer-dueDate"
              label="Due Date"
              value={dueDateDraft}
              onChange={setDueDateDraft}
            />
          </div>

          <div className="flex flex-wrap gap-[6px]">
            {issueState.labels.map((label) => (
              <Chip
                className="border-transparent font-[var(--app-font-weight-500)]"
                key={label.id}
                size="sm"
                style={{
                  backgroundColor: `${label.color}1A`,
                  color: label.color,
                }}
                variant="neutral"
              >
                {label.name}
              </Chip>
            ))}
          </div>
        </section>

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
            value={descriptionDraft}
            onChange={setDescriptionDraft}
            placeholder="이슈에 대한 자세한 설명을 작성해주세요..."
            minHeight="160px"
          />
        </section>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] leading-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
              Recent activity
            </h3>
            <Link
              className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[#4338CA]"
              href={fullPageHref}
            >
              View full history
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {visibleActivity.length > 0 ? (
              visibleActivity.map((entry) => (
                <div
                  className="rounded-[12px] bg-[#FCFCFD] px-[14px] py-3"
                  key={entry.id}
                >
                  <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[#111318]">
                    {entry.summary}
                  </p>
                  <p className="mt-1 text-[11px] leading-[1.45] font-[var(--app-font-weight-600)] text-[#374151]">
                    {memberNamesById[entry.actorId] ?? entry.actorId}
                  </p>
                  <p className="mt-1 text-[12px] leading-[1.45] text-[#6B7280]">
                    {formatRelativeTime(entry.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[12px] bg-[#FCFCFD] px-[14px] py-3 text-[12px] leading-[1.45] text-[#6B7280]">
                No recent activity.
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] leading-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
              Metadata summary
            </h3>
            <span className="rounded-full bg-[#F3F4F6] px-[10px] py-[6px] text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              Compact
            </span>
          </div>

          <div className="whitespace-pre-line text-[12px] leading-[1.5] text-[#6B7280]">
            {[
              `Created ${formatCompactDate(issueState.createdAt)} · Updated ${formatRelativeTime(issueState.updatedAt)}`,
              createdByName || lastEditedByName
                ? `Author ${createdByName ?? "Unknown"} · Last editor ${lastEditedByName ?? createdByName ?? "Unknown"}`
                : null,
            ]
              .filter(Boolean)
              .join("\n")}
          </div>
        </section>
      </div>

      <footer className="flex items-center justify-between gap-4">
        <p className="text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#6B7280]">
          Scroll inside this drawer for more. Full page remains the source of
          truth for deeper edits.
        </p>
        <Button
          disabled={isSaving || !hasPendingChanges}
          onClick={saveChanges}
          size="sm"
        >
          Save changes
        </Button>
      </footer>
    </aside>
  );
}
