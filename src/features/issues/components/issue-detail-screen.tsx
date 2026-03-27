"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button, getButtonClassName } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ConflictDialog } from "@/components/molecules/ConflictDialog";
import { DueDateField } from "@/components/molecules/DueDateField";
import { MarkdownEditor } from "@/components/molecules/MarkdownEditor";
import { IssueActivityItem } from "@/features/issues/components/IssueActivityItem";
import { IssueCommentMeta } from "@/features/issues/components/IssueCommentMeta";
import { IssueDateMeta } from "@/features/issues/components/IssueDateMeta";
import { IssueEmptyState } from "@/features/issues/components/IssueEmptyState";
import { IssueFieldBlock } from "@/features/issues/components/IssueFieldBlock";
import { IssueIdentifierBadge } from "@/features/issues/components/IssueIdentifierBadge";
import { IssueLabelChip } from "@/features/issues/components/IssueLabelChip";
import { IssueMetaRow } from "@/features/issues/components/IssueMetaRow";
import { IssuePanel } from "@/features/issues/components/IssuePanel";
import { IssuePriorityBadge } from "@/features/issues/components/IssuePriorityBadge";
import { IssueSectionHeader } from "@/features/issues/components/IssueSectionHeader";
import { IssueStatusBadge } from "@/features/issues/components/IssueStatusBadge";
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
import { hasMeaningfulRichTextContent } from "@/lib/rich-text";

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

function DetailPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <IssuePanel className={className} padding="lg" shadow="elevated">
      {children}
    </IssuePanel>
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
    <IssuePanel padding="lg" shadow="elevated">
      <div className="flex flex-col gap-3">
        <h1 className={`text-[20px] font-bold ${titleClassName}`}>{title}</h1>
        {children}
        {actions ? (
          <div className="flex flex-wrap gap-3 pt-1">{actions}</div>
        ) : null}
      </div>
    </IssuePanel>
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
}: IssueDetailStateScreenProps) {
  const router = useRouter();

  useEffect(() => {
    toast.error(
      "We couldn't load this issue. Refresh the detail view to try again."
    );

    const timer = setTimeout(() => {
      router.push(boardHref);
    }, 2000);

    return () => clearTimeout(timer);
  }, [boardHref, router]);

  return null;
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
  const [isDescriptionEditorOpen, setIsDescriptionEditorOpen] = useState(false);
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<{
    currentVersion: number;
    requestedVersion: number;
  } | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const hasDescriptionContent = hasMeaningfulRichTextContent(descriptionDraft);
  const hasCommentContent = hasMeaningfulRichTextContent(commentDraft);

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

  const handleDeleteIssue = () => {
    if (
      !confirm(
        "Are you sure you want to delete this issue? This action cannot be undone."
      )
    ) {
      return;
    }

    startSavingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/issues/${issueState.id}/delete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: issueState.projectId,
            }),
          }
        );

        const data = (await response.json()) as unknown;

        if (!response.ok) {
          throw new Error(
            getMutationErrorMessage({
              actionLabel: "issue",
              code: getMutationErrorCode(data),
              fallbackMessage: getMutationErrorFallbackMessage(data),
              status: response.status,
            })
          );
        }

        toast.success("Issue deleted successfully.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete issue."
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
                <IssueIdentifierBadge identifier={issueState.identifier} />
                <IssueStatusBadge status={issueState.status} />
                <IssuePriorityBadge priority={issueState.priority} />
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
                <IssueFieldBlock
                  bodyClassName="flex items-center justify-between rounded-[10px] border border-[#E6E8EC] bg-white px-[10px] py-[12px]"
                  htmlFor="detail-issue-status"
                  label="Status"
                  labelClassName="font-semibold"
                >
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
                </IssueFieldBlock>

                <IssueFieldBlock
                  bodyClassName="flex items-center justify-between rounded-[10px] border border-[#E6E8EC] bg-white px-[10px] py-[12px]"
                  htmlFor="detail-issue-priority"
                  label="Priority"
                  labelClassName="font-semibold"
                >
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
                </IssueFieldBlock>

                <IssueFieldBlock
                  bodyClassName="flex items-center justify-between rounded-[10px] border border-[#E6E8EC] bg-white px-[10px] py-[12px]"
                  htmlFor="detail-issue-assignee"
                  label="Assignee"
                  labelClassName="font-semibold"
                >
                  <Field
                    id="detail-issue-assignee"
                    onChange={(event) => setAssigneeDraft(event.target.value)}
                    placeholder="Assign to..."
                    value={assigneeDraft}
                    className="border-0 bg-transparent p-0 text-[13px]"
                  />
                </IssueFieldBlock>

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
                  {hasDescriptionContent ? "Ready" : "Empty"}
                </Chip>
              </div>
              <div className="mt-4">
                {isDescriptionEditorOpen ||
                descriptionDraft !== issueState.description ? (
                  <MarkdownEditor
                    value={descriptionDraft}
                    onChange={(value) => setDescriptionDraft(value)}
                    placeholder="Add a description..."
                    minHeight="220px"
                    issueId={issueState.id}
                    projectId={issueState.projectId}
                  />
                ) : (
                  <button
                    className="flex min-h-[160px] w-full items-center justify-center rounded-[16px] border border-dashed border-[#D7DCE5] bg-[#FCFCFD] px-6 py-8 text-[14px] font-medium text-[#6B7280] transition hover:border-[#C7D2FE] hover:text-[#3730A3]"
                    onClick={() => setIsDescriptionEditorOpen(true)}
                    type="button"
                  >
                    Edit description
                  </button>
                )}
              </div>
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
              <IssueSectionHeader
                badge={
                  <span className="text-[12px] font-semibold text-[#6B7280]">
                    {commentsState.length} total
                  </span>
                }
                title="Comments"
                titleClassName="text-[18px] font-bold"
              />

              <div className="mt-4 rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4">
                <label
                  className="text-[11px] font-semibold text-[#6B7280]"
                  htmlFor="issue-comment"
                >
                  Add comment
                </label>
                {isCommentComposerOpen || commentDraft.length > 0 ? (
                  <>
                    <MarkdownEditor
                      className="mt-2"
                      issueId={issueState.id}
                      minHeight="120px"
                      onChange={setCommentDraft}
                      placeholder="Write a comment..."
                      projectId={issueState.projectId}
                      value={commentDraft}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button
                        disabled={isSaving || !hasCommentContent}
                        onClick={submitComment}
                        size="sm"
                      >
                        Post comment
                      </Button>
                    </div>
                  </>
                ) : (
                  <button
                    className="mt-2 flex min-h-[88px] w-full items-center justify-center rounded-[12px] border border-dashed border-[#D7DCE5] bg-white px-4 py-6 text-[13px] font-medium text-[#6B7280] transition hover:border-[#C7D2FE] hover:text-[#3730A3]"
                    onClick={() => setIsCommentComposerOpen(true)}
                    type="button"
                  >
                    Write a comment
                  </button>
                )}
              </div>

              {commentsState.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {commentsState.map((comment) => (
                    <li
                      key={comment.id}
                      className="rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4"
                    >
                      <IssueCommentMeta
                        authorLabel={comment.authorId}
                        className="[&_span:first-child]:text-[13px] [&_span:first-child]:font-semibold [&_span:last-child]:text-[12px] [&_span:last-child]:font-medium"
                        createdAt={comment.createdAt}
                      />
                      <div
                        className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-[14px] leading-6 font-medium text-[#111318]"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Comment HTML is produced by the editor flow.
                        dangerouslySetInnerHTML={{ __html: comment.body }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <IssueEmptyState
                  className="mt-4 rounded-[14px] border border-dashed border-[#D7DCE5] bg-[#FCFCFD] px-[18px] py-6 text-[13px] font-medium text-[#8A90A2]"
                  message="No comments yet."
                />
              )}
            </DetailPanel>
          </div>

          <aside className="flex flex-col gap-6">
            <DetailPanel>
              <IssueSectionHeader
                title="Metadata"
                titleClassName="text-[18px] font-bold"
              />
              <div className="mt-4 grid gap-3">
                <IssueMetaRow
                  label="Issue ID"
                  value={issueState.identifier}
                  variant="boxed"
                />
                <IssueMetaRow
                  label="Created"
                  value={<IssueDateMeta value={issueState.createdAt} />}
                  variant="boxed"
                />
                <IssueMetaRow
                  label="Updated"
                  value={<IssueDateMeta value={issueState.updatedAt} />}
                  variant="boxed"
                />
              </div>
            </DetailPanel>

            <DetailPanel>
              <IssueSectionHeader
                title="Labels"
                titleClassName="text-[18px] font-bold"
              />
              <div className="mt-4 rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4">
                {issueState.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {issueState.labels.map((label) => (
                      <IssueLabelChip
                        className="border"
                        key={label.id}
                        label={label}
                        size="sm"
                      />
                    ))}
                  </div>
                ) : (
                  <IssueEmptyState
                    className="text-[13px] font-medium text-[#8A90A2]"
                    message="No labels selected"
                  />
                )}
              </div>
            </DetailPanel>

            <DetailPanel>
              <IssueSectionHeader
                badge={
                  <span className="text-[12px] font-semibold text-[#6B7280]">
                    {activityState.length} events
                  </span>
                }
                title="Activity"
                titleClassName="text-[18px] font-bold"
              />
              {activityState.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {activityState.map((entry) => (
                    <li className="list-none" key={entry.id}>
                      <IssueActivityItem
                        className="rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4"
                        createdAt={entry.createdAt}
                        summary={entry.summary}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <IssueEmptyState
                  className="mt-4 rounded-[14px] border border-dashed border-[#D7DCE5] bg-[#FCFCFD] px-[18px] py-6 text-[13px] font-medium text-[#8A90A2]"
                  message="No activity yet."
                />
              )}
            </DetailPanel>

            <DetailPanel className="border-red-200 bg-red-50">
              <IssueSectionHeader
                title="Danger Zone"
                titleClassName="text-[18px] font-bold text-red-900"
              />
              <div className="mt-4">
                <p className="text-[13px] font-medium text-red-700">
                  Once you delete an issue, there is no going back. Please be
                  certain.
                </p>
                <Button
                  className="mt-3 bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDeleteIssue}
                  size="sm"
                  variant="secondary"
                >
                  Delete this issue
                </Button>
              </div>
            </DetailPanel>
          </aside>
        </section>
      </div>
    </main>
  );
}
