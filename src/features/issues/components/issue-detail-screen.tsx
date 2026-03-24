"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button, getButtonClassName } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ConflictDialog } from "@/components/molecules/ConflictDialog";
import { DueDateField } from "@/components/molecules/DueDateField";
import {
  getMutationErrorCode,
  getMutationErrorFallbackMessage,
  getMutationErrorMessage,
} from "@/features/issues/lib/mutation-error-messages";
import type {
  ActivityLogEntry,
  Comment,
  ConflictError,
  Issue,
} from "@/features/issues/types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";

interface IssueDetailScreenProps {
  boardHref?: string;
  createHref?: string;
  issue: Issue;
  comments?: Comment[];
  activityLog?: ActivityLogEntry[];
}

interface IssueDetailStateScreenProps {
  boardHref: string;
  createHref?: string;
  onRetry?: () => void;
}

interface IssueUpdateResponse {
  activityLog: ActivityLogEntry[];
  issue: Issue;
}

interface CommentCreateResponse {
  activityEntry: ActivityLogEntry;
  comment: Comment;
}

const EMPTY_COMMENTS: Comment[] = [];
const EMPTY_ACTIVITY_LOG: ActivityLogEntry[] = [];

function isIssueUpdateResponse(value: unknown): value is IssueUpdateResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "issue" in value &&
      "activityLog" in value
  );
}

function isCommentCreateResponse(
  value: unknown
): value is CommentCreateResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "comment" in value &&
      "activityEntry" in value
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

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPriorityVariant(priority: Issue["priority"]) {
  if (priority === "Urgent") return "danger" as const;
  if (priority === "High") return "violet" as const;
  if (priority === "Medium") return "outline" as const;
  return "neutral" as const;
}

function DetailPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[20px] border border-[#E6E8EC] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <span className="text-[11px] font-semibold text-[#6B7280]">{label}</span>
      <div className="rounded-[10px] border border-[#E6E8EC] bg-white px-3 py-[10px] text-[13px] font-medium text-[#374151]">
        {value}
      </div>
    </div>
  );
}

function IssueStateCard({
  actions,
  children,
  title,
  titleClassName = "text-[#111318]",
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
  title: string;
  titleClassName?: string;
}) {
  return (
    <section className="rounded-[20px] border border-[#E6E8EC] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3">
        <h1 className={`text-[20px] font-bold ${titleClassName}`}>{title}</h1>
        {children}
        {actions ? (
          <div className="flex flex-wrap gap-3 pt-1">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export function IssueDetailLoadingScreen() {
  return (
    <main className="app-shell">
      <div className="app-stack">
        <section className="rounded-[20px] border border-[#E6E8EC] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5">
            <div className="sr-only">
              <h1>Loading</h1>
              <p role="status">
                We&apos;re loading the latest issue details and activity.
              </p>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-10 w-full max-w-[420px] rounded-[16px]" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-[12px]" />
                <Skeleton className="h-10 w-28 rounded-[12px]" />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_320px]">
              <div className="flex flex-col gap-5">
                <DetailPanel className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-11 w-full rounded-[10px]" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-[180px] w-full rounded-[16px]" />
                  </div>
                </DetailPanel>

                <DetailPanel className="space-y-4">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <div className="space-y-3">
                    <Skeleton className="h-[78px] w-full rounded-[14px]" />
                    <Skeleton className="h-[78px] w-full rounded-[14px]" />
                  </div>
                </DetailPanel>
              </div>

              <div className="flex flex-col gap-5">
                <DetailPanel className="space-y-4">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="grid gap-3">
                    <Skeleton className="h-[58px] w-full rounded-[10px]" />
                    <Skeleton className="h-[58px] w-full rounded-[10px]" />
                    <Skeleton className="h-[58px] w-full rounded-[10px]" />
                  </div>
                </DetailPanel>

                <DetailPanel className="space-y-4">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full rounded-[12px]" />
                    <Skeleton className="h-12 w-full rounded-[12px]" />
                  </div>
                </DetailPanel>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function IssueDetailErrorScreen({
  boardHref,
  onRetry,
}: IssueDetailStateScreenProps) {
  return (
    <main className="app-shell">
      <div className="app-stack">
        <IssueStateCard
          actions={
            <>
              <button
                className={getButtonClassName("primary", "sm")}
                onClick={onRetry}
                type="button"
              >
                Retry
              </button>
              <Link
                className={getButtonClassName("secondary", "sm")}
                href={boardHref}
              >
                Back to board
              </Link>
            </>
          }
          title="Error"
          titleClassName="text-[#9A3412]"
        >
          <div className="rounded-[14px] border border-[#FDBA74] bg-[#FFF7ED] px-[18px] py-4">
            <p className="text-[16px] font-bold text-[#9A3412]">
              We couldn&apos;t load this issue
            </p>
            <p className="mt-2 text-[13px] font-medium leading-5 text-[#7C2D12]">
              Refresh the detail view to try again, or return to the board and
              open another issue.
            </p>
          </div>
        </IssueStateCard>
      </div>
    </main>
  );
}

export function IssueDetailNotFoundScreen({
  boardHref,
  createHref,
}: IssueDetailStateScreenProps) {
  return (
    <main className="app-shell">
      <div className="app-stack">
        <IssueStateCard
          actions={
            <>
              <Link
                className={`${getButtonClassName("primary", "sm")} border-[#111318] bg-[#111318] hover:border-[#111318] hover:bg-[#111318]`}
                href={boardHref}
              >
                Back to board
              </Link>
              {createHref ? (
                <Link
                  className={getButtonClassName("secondary", "sm")}
                  href={createHref}
                >
                  Create issue
                </Link>
              ) : null}
            </>
          }
          title="Not Found"
        >
          <p className="text-[13px] font-medium leading-5 text-[#4B5563]">
            This issue may have been deleted or moved to a different project.
            Return to the board to continue, or create a replacement issue.
          </p>
        </IssueStateCard>
      </div>
    </main>
  );
}

export function IssueDetailScreen({
  boardHref,
  createHref,
  issue,
  comments = EMPTY_COMMENTS,
  activityLog = EMPTY_ACTIVITY_LOG,
}: IssueDetailScreenProps) {
  const [issueState, setIssueState] = useState(issue);
  const [commentsState, setCommentsState] = useState(comments);
  const [activityState, setActivityState] = useState(activityLog);
  const [titleDraft, setTitleDraft] = useState(issue.title);
  const [descriptionDraft, setDescriptionDraft] = useState(issue.description);
  const [statusDraft, setStatusDraft] = useState(issue.status);
  const [priorityDraft, setPriorityDraft] = useState(issue.priority);
  const [dueDateDraft, setDueDateDraft] = useState(
    issue.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : ""
  );
  const [assigneeDraft, setAssigneeDraft] = useState(issue.assigneeId ?? "");
  const [commentDraft, setCommentDraft] = useState("");
  const [conflictInfo, setConflictInfo] = useState<{
    currentVersion: number;
    requestedVersion: number;
  } | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  useEffect(() => {
    setIssueState(issue);
    setCommentsState(comments);
    setActivityState(activityLog);
    setTitleDraft(issue.title);
    setDescriptionDraft(issue.description);
    setStatusDraft(issue.status);
    setPriorityDraft(issue.priority);
    setAssigneeDraft(issue.assigneeId ?? "");
  }, [issue, comments, activityLog]);

  const saveIssueUpdates = (
    updates: Partial<
      Pick<
        Issue,
        | "assigneeId"
        | "description"
        | "dueDate"
        | "priority"
        | "status"
        | "title"
      >
    >,
    successMessage: string
  ) => {
    setConflictInfo(null);

    startSavingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/issues/${issueState.id}/detail`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...updates,
              version: issueState.version,
            }),
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
        toast.success(successMessage);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update issue."
        );
      }
    });
  };

  const submitComment = () => {
    setConflictInfo(null);

    startSavingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/issues/${issueState.id}/comments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              body: commentDraft,
            }),
          }
        );
        const data = (await response.json()) as unknown;

        if (!response.ok) {
          throw new Error(
            getMutationErrorMessage({
              actionLabel: "comment",
              code: getMutationErrorCode(data),
              fallbackMessage: getMutationErrorFallbackMessage(data),
              status: response.status,
            })
          );
        }

        if (!isCommentCreateResponse(data)) {
          throw new Error("Invalid comment response.");
        }

        setCommentsState((current) => [data.comment, ...current]);
        setActivityState((current) => [data.activityEntry, ...current]);
        setCommentDraft("");
        toast.success("Comment posted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create comment."
        );
      }
    });
  };

  return (
    <main className="app-shell">
      <div className="app-stack">
        {conflictInfo && (
          <ConflictDialog
            currentVersion={conflictInfo.currentVersion}
            requestedVersion={conflictInfo.requestedVersion}
            onDismiss={() => setConflictInfo(null)}
          />
        )}

        <DetailPanel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Chip variant="accent">{issueState.identifier}</Chip>
                <Chip variant="outline">{issueState.status}</Chip>
                <Chip variant={getPriorityVariant(issueState.priority)}>
                  {issueState.priority}
                </Chip>
                {isSaving ? <Chip variant="neutral">Saving</Chip> : null}
              </div>
              <label
                className="mt-4 block text-[11px] font-semibold text-[#6B7280]"
                htmlFor="issue-title"
              >
                Title
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Field
                  className="h-12 text-[18px] font-semibold"
                  id="issue-title"
                  onChange={(event) => setTitleDraft(event.target.value)}
                  value={titleDraft}
                />
                <Button
                  disabled={isSaving || titleDraft.trim() === issueState.title}
                  onClick={() =>
                    saveIssueUpdates(
                      { title: titleDraft.trim() },
                      "Title updated."
                    )
                  }
                  size="sm"
                >
                  Save title
                </Button>
              </div>
              <p className="mt-3 max-w-[720px] text-[14px] leading-6 font-medium text-[#4B5563]">
                Full-page issue detail stays primary for editing depth, longer
                context, and recovery states.
              </p>

              {/* Issue Control Row */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col gap-[6px]">
                  <label
                    className="text-[11px] leading-[11px] font-semibold text-[#6B7280]"
                    htmlFor="detail-issue-status"
                  >
                    Status
                  </label>
                  <div className="flex items-center justify-between rounded-[10px] border border-[#E6E8EC] bg-white px-[10px] py-[12px]">
                    <Select
                      id="detail-issue-status"
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
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label
                    className="text-[11px] leading-[11px] font-semibold text-[#6B7280]"
                    htmlFor="detail-issue-priority"
                  >
                    Priority
                  </label>
                  <div className="flex items-center justify-between rounded-[10px] border border-[#E6E8EC] bg-white px-[10px] py-[12px]">
                    <Select
                      id="detail-issue-priority"
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
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label
                    className="text-[11px] leading-[11px] font-semibold text-[#6B7280]"
                    htmlFor="detail-issue-assignee"
                  >
                    Assignee
                  </label>
                  <div className="flex items-center justify-between rounded-[10px] border border-[#E6E8EC] bg-white px-[10px] py-[12px]">
                    <Field
                      id="detail-issue-assignee"
                      onChange={(event) => setAssigneeDraft(event.target.value)}
                      placeholder="Assign to..."
                      value={assigneeDraft}
                      className="border-0 bg-transparent p-0 text-[13px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <DueDateField
                    id="detail-issue-due-date"
                    label="Due Date"
                    onChange={(date) => setDueDateDraft(date || "")}
                    value={dueDateDraft}
                  />
                </div>
              </div>
            </div>

            {(boardHref || createHref) && (
              <div className="flex flex-wrap gap-3">
                {boardHref ? (
                  <Link
                    className={getButtonClassName("secondary", "sm")}
                    href={boardHref}
                  >
                    Back to board
                  </Link>
                ) : null}
                {createHref ? (
                  <Link
                    className={getButtonClassName("primary", "sm")}
                    href={createHref}
                  >
                    Create issue
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </DetailPanel>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
          <div className="flex flex-col gap-6">
            <DetailPanel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-bold text-[#111318]">
                  Description
                </h2>
                <Chip variant="outline">
                  {descriptionDraft.trim().length > 0 ? "Ready" : "Empty"}
                </Chip>
              </div>
              <label className="sr-only" htmlFor="issue-description">
                Description
              </label>
              <textarea
                className="mt-4 min-h-[220px] w-full rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4 text-[14px] leading-6 font-medium text-[#111318] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)]"
                id="issue-description"
                onChange={(event) => setDescriptionDraft(event.target.value)}
                value={descriptionDraft}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  disabled={
                    isSaving || descriptionDraft === issueState.description
                  }
                  onClick={() =>
                    saveIssueUpdates(
                      { description: descriptionDraft },
                      "Description updated."
                    )
                  }
                  size="sm"
                >
                  Save description
                </Button>
              </div>
            </DetailPanel>

            <DetailPanel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-bold text-[#111318]">
                  Comments
                </h2>
                <span className="text-[12px] font-semibold text-[#6B7280]">
                  {commentsState.length} total
                </span>
              </div>

              <div className="mt-4 rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4">
                <label
                  className="text-[11px] font-semibold text-[#6B7280]"
                  htmlFor="issue-comment"
                >
                  Add comment
                </label>
                <textarea
                  className="mt-2 min-h-[120px] w-full rounded-[14px] border border-[#E6E8EC] bg-white px-4 py-3 text-[14px] leading-6 font-medium text-[#111318] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-color-brand-300)]"
                  id="issue-comment"
                  onChange={(event) => setCommentDraft(event.target.value)}
                  value={commentDraft}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    disabled={isSaving || commentDraft.trim().length === 0}
                    onClick={submitComment}
                    size="sm"
                  >
                    Post comment
                  </Button>
                </div>
              </div>

              {commentsState.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {commentsState.map((comment) => (
                    <li
                      key={comment.id}
                      className="rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-[13px] font-semibold text-[#111318]">
                          {comment.authorId}
                        </strong>
                        <span className="text-[12px] font-medium text-[#6B7280]">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-[14px] leading-6 font-medium text-[#111318]">
                        {comment.body}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 rounded-[14px] border border-dashed border-[#D7DCE5] bg-[#FCFCFD] px-[18px] py-6 text-[13px] font-medium text-[#8A90A2]">
                  No comments yet.
                </div>
              )}
            </DetailPanel>
          </div>

          <aside className="flex flex-col gap-6">
            <DetailPanel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-bold text-[#111318]">
                  Metadata
                </h2>
              </div>
              <div className="mt-4 grid gap-3">
                <DetailField label="Issue ID" value={issueState.identifier} />
                <DetailField
                  label="Created"
                  value={formatTimestamp(issueState.createdAt)}
                />
                <DetailField
                  label="Updated"
                  value={formatTimestamp(issueState.updatedAt)}
                />
              </div>
            </DetailPanel>

            <DetailPanel>
              <h2 className="text-[18px] font-bold text-[#111318]">Labels</h2>
              <div className="mt-4 rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4">
                {issueState.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {issueState.labels.map((label) => (
                      <Chip
                        className="border"
                        key={label.id}
                        size="sm"
                        style={{
                          backgroundColor: `${label.color}1A`,
                          borderColor: `${label.color}33`,
                          color: label.color,
                        }}
                        variant="neutral"
                      >
                        {label.name}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <span className="text-[13px] font-medium text-[#8A90A2]">
                    No labels selected
                  </span>
                )}
              </div>
            </DetailPanel>

            <DetailPanel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-bold text-[#111318]">
                  Activity
                </h2>
                <span className="text-[12px] font-semibold text-[#6B7280]">
                  {activityState.length} events
                </span>
              </div>
              {activityState.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {activityState.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4"
                    >
                      <strong className="text-[13px] font-semibold text-[#111318]">
                        {entry.summary}
                      </strong>
                      <div className="mt-2 text-[12px] font-medium text-[#6B7280]">
                        {formatTimestamp(entry.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 rounded-[14px] border border-dashed border-[#D7DCE5] bg-[#FCFCFD] px-[18px] py-6 text-[13px] font-medium text-[#8A90A2]">
                  No activity yet.
                </div>
              )}
            </DetailPanel>
          </aside>
        </section>
      </div>
    </main>
  );
}
