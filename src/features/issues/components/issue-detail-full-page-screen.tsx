"use client";

import { ChevronLeft, Ellipsis, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button, getButtonClassName } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { ConflictDialog } from "@/components/molecules/ConflictDialog";
import { DueDateField } from "@/components/molecules/DueDateField";
import { LabelSelector } from "@/components/molecules/LabelSelector";
import { MarkdownEditor } from "@/components/molecules/MarkdownEditor";
import { createLabelAction } from "@/features/issues/actions/create-label-action";
import { updateIssueLabelsAction } from "@/features/issues/actions/update-issue-labels-action";
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
  Label,
} from "@/features/issues/types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";

interface IssueDetailFullPageScreenProps {
  assigneeOptions?: Array<{
    label: string;
    value: string;
  }>;
  availableLabels?: Label[];
  boardHref?: string;
  issue: Issue;
  comments?: Comment[];
  activityLog?: ActivityLogEntry[];
  memberNamesById?: Record<string, string>;
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

function formatTimestamp(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours % 12 || 12;

  return `${year}. ${month}. ${day}. ${period} ${hour12}:${minutes}`;
}

function getPriorityTone(priority: Issue["priority"]) {
  if (priority === "Urgent" || priority === "High") return "text-[#DC2626]";
  if (priority === "Medium") return "text-[#D97706]";
  return "text-[#6B7280]";
}

function getFailureMemo(issue: Issue) {
  if (issue.priority === "Urgent" || issue.priority === "High") {
    return "High-priority issue. Validate edge cases and rollback notes before shipping.";
  }

  if (issue.status === "In Progress") {
    return "Implementation in progress. Keep owner notes and verification scope visible for handoff.";
  }

  return "Capture delivery risk, QA notes, and follow-up items here when the issue gets closer to release.";
}

function formatRelativeTime(value: string) {
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

export function IssueDetailFullPageScreen({
  activityLog = EMPTY_ACTIVITY_LOG,
  assigneeOptions = [],
  availableLabels = [],
  boardHref,
  comments = EMPTY_COMMENTS,
  issue,
  memberNamesById = {},
}: IssueDetailFullPageScreenProps) {
  const [issueState, setIssueState] = useState(issue);
  const [commentsState, setCommentsState] = useState(comments);
  const [activityState, setActivityState] = useState(activityLog);
  const [titleDraft, setTitleDraft] = useState(issue.title);
  const [descriptionDraft, setDescriptionDraft] = useState(issue.description);
  const [statusDraft, setStatusDraft] = useState(issue.status);
  const [priorityDraft, setPriorityDraft] = useState(issue.priority);
  const [assigneeDraft, setAssigneeDraft] = useState(issue.assigneeId ?? "");
  const [dueDateDraft, setDueDateDraft] = useState(issue.dueDate);
  const [selectedLabelIds, setSelectedLabelIds] = useState(
    issue.labels.map((label) => label.id)
  );
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setDueDateDraft(issue.dueDate);
    setSelectedLabelIds(issue.labels.map((label) => label.id));
  }, [issue, comments, activityLog]);

  const hasPendingChanges =
    titleDraft.trim() !== issueState.title ||
    descriptionDraft !== issueState.description ||
    statusDraft !== issueState.status ||
    priorityDraft !== issueState.priority ||
    assigneeDraft.trim() !== (issueState.assigneeId ?? "") ||
    dueDateDraft !== issueState.dueDate ||
    // 라벨 변경 확인 (Set으로 비교)
    JSON.stringify([...selectedLabelIds].sort()) !==
      JSON.stringify([...issueState.labels.map((l) => l.id)].sort());
  const assigneeLabel =
    memberNamesById[issueState.assigneeId ?? ""] ??
    issueState.assigneeId ??
    "Unassigned";
  const lastEditedByLabel =
    memberNamesById[issueState.updatedBy] ?? issueState.updatedBy;

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId]
    );
  };

  const handleCreateLabel = async (name: string) => {
    const result = await createLabelAction({
      projectId: issue.projectId,
      name,
    });

    if (result.success && result.label) {
      toast.success(`Label "${name}" created`);
      // 새 라벨을 자동으로 선택
      setSelectedLabelIds((current) => [...current, result.label.id]);
    } else {
      toast.error(result.error || "Failed to create label");
    }
  };

  const saveAllChanges = () => {
    setErrorMessage(null);
    setConflictInfo(null);
    setFeedbackMessage(null);

    startSavingTransition(async () => {
      try {
        // 라벨 업데이트 (별도 API 호출)
        const labelResponse = await updateIssueLabelsAction({
          issueId: issueState.id,
          projectId: issueState.projectId,
          labelIds: selectedLabelIds,
        });

        if (!labelResponse.success) {
          throw new Error(labelResponse.error || "Failed to update labels");
        }

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
        // 라벨은 이미 updateIssueLabelsAction에서 업데이트됨
        setSelectedLabelIds(data.issue.labels.map((label) => label.id));
        toast.success("Changes saved.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save changes."
        );
      }
    });
  };

  const submitComment = () => {
    setErrorMessage(null);
    setConflictInfo(null);
    setFeedbackMessage(null);

    startSavingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/issues/${issueState.id}/comments`,
          {
            body: JSON.stringify({ body: commentDraft }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
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

  const startEditComment = (commentId: string, body: string) => {
    setEditingCommentId(commentId);
    setEditingCommentBody(body);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentBody("");
  };

  const saveCommentEdit = async (commentId: string) => {
    startSavingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/issues/${issueState.id}/comments/${commentId}`,
          {
            body: JSON.stringify({ body: editingCommentBody }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "PATCH",
          }
        );
        const data = await response.json();

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

        setCommentsState((current) =>
          current.map((comment) =>
            comment.id === commentId
              ? { ...comment, body: data.comment.body }
              : comment
          )
        );
        cancelEditComment();
        toast.success("Comment updated.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update comment."
        );
      }
    });
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    startSavingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/issues/${issueState.id}/comments/${commentId}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            getMutationErrorMessage({
              actionLabel: "comment",
              code: getMutationErrorCode(data),
              fallbackMessage: getMutationErrorFallbackMessage(data),
              status: response.status,
            })
          );
        }

        setCommentsState((current) =>
          current.filter((comment) => comment.id !== commentId)
        );
        toast.success("Comment deleted.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete comment."
        );
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#FCFCFD]">
      <div className="flex flex-col gap-4 px-4 py-4 md:hidden">
        {conflictInfo ? (
          <ConflictDialog
            currentVersion={conflictInfo.currentVersion}
            onDismiss={() => setConflictInfo(null)}
            requestedVersion={conflictInfo.requestedVersion}
          />
        ) : null}

        {errorMessage ? (
          <div className="rounded-[14px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-[#991B1B]">
            {errorMessage}
          </div>
        ) : null}
        {feedbackMessage ? (
          <div className="rounded-[14px] border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3 text-[13px] font-medium text-[#3730A3]">
            {feedbackMessage}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {boardHref ? (
              <Link
                aria-label="Back to board"
                className="inline-flex h-4 w-4 items-center justify-center text-[#111318]"
                href={boardHref}
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-4 w-4 items-center justify-center text-[#111318]">
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </span>
            )}
            <h1 className="truncate text-[16px] leading-[16px] font-[var(--app-font-weight-600)] text-[#111318]">
              Issue detail
            </h1>
          </div>

          <button
            aria-label="More issue actions"
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E6E8EC] bg-white"
            type="button"
          >
            <Ellipsis
              aria-hidden="true"
              className="h-[14px] w-[14px] text-[#6B7280]"
            />
          </button>
        </div>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <span className="text-[12px] font-[var(--app-font-weight-700)] text-[#5E6AD2]">
            {issueState.identifier}
          </span>
          <h2 className="text-[20px] leading-[1.25] font-[var(--app-font-weight-600)] text-[#111318]">
            {issueState.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="neutral">
              {issueState.status}
            </Chip>
            <Chip
              size="sm"
              variant={
                issueState.priority === "Urgent" ||
                issueState.priority === "High"
                  ? "danger"
                  : "neutral"
              }
            >
              {issueState.priority}
            </Chip>
          </div>
          <p className="text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#6B7280]">
            {assigneeLabel} assigned ·{" "}
            {formatRelativeTime(issueState.updatedAt)} updated
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-[var(--app-font-weight-600)] text-[#111318]">
              Description
            </h2>
            <span className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              Markdown
            </span>
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-[1.5] text-[#111318]">
            {issueState.description || "No description yet."}
          </p>
          {issueState.labels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {issueState.labels.map((label) => (
                <span
                  className="text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[#4338CA]"
                  key={label.id}
                >
                  {label.name}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <h2 className="text-[14px] font-[var(--app-font-weight-600)] text-[#111318]">
            Comments
          </h2>
          {commentsState.length > 0 ? (
            commentsState.slice(0, 1).map((comment) => (
              <div className="flex flex-col gap-2" key={comment.id}>
                <p className="text-[11px] font-[var(--app-font-weight-600)] text-[#111318]">
                  {memberNamesById[comment.authorId] ?? comment.authorId} ·{" "}
                  {formatRelativeTime(comment.createdAt)}
                </p>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-[1.45] text-[#4B5563]"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: User-generated markdown content
                  dangerouslySetInnerHTML={{ __html: comment.body }}
                />
              </div>
            ))
          ) : (
            <p className="text-[13px] leading-[1.45] text-[#6B7280]">
              No comments yet.
            </p>
          )}

          <MarkdownEditor
            value={commentDraft}
            onChange={setCommentDraft}
            placeholder="댓글을 입력하세요..."
            minHeight="44px"
          />
          <div className="flex justify-end">
            <Button
              disabled={isSaving || commentDraft.trim().length === 0}
              onClick={submitComment}
              size="sm"
              variant="secondary"
            >
              Post
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2 rounded-[16px] border border-[#E6E8EC] bg-white p-[14px]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-[var(--app-font-weight-600)] text-[#111318]">
              Metadata
            </h2>
            <Chip size="sm" variant="neutral">
              Summary
            </Chip>
          </div>
          <p className="whitespace-pre-wrap text-[11px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#4B5563]">
            {`Created ${formatTimestamp(issueState.createdAt)} · Updated ${formatRelativeTime(
              issueState.updatedAt
            )}\nAuthor ${memberNamesById[issueState.createdBy] ?? issueState.createdBy} · Last editor ${lastEditedByLabel}`}
          </p>
        </section>

        <section className="flex flex-col gap-2 rounded-[16px] border border-[#E6E8EC] bg-white p-[14px]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-[var(--app-font-weight-600)] text-[#111318]">
              Recent activity
            </h2>
            <span className="text-[11px] font-[var(--app-font-weight-700)] text-[#4338CA]">
              View full history
            </span>
          </div>
          {activityState.length > 0 ? (
            activityState.slice(0, 2).map((entry) => (
              <div
                className="flex flex-col gap-[2px] rounded-[12px] bg-[#FCFCFD] px-3 py-[10px]"
                key={entry.id}
              >
                <p className="text-[11px] font-[var(--app-font-weight-600)] text-[#111318]">
                  {memberNamesById[entry.actorId] ?? entry.actorId} ·{" "}
                  {formatRelativeTime(entry.createdAt)}
                </p>
                <p className="text-[11px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#4B5563]">
                  {entry.summary}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-[#6B7280]">No activity yet.</p>
          )}
        </section>
      </div>

      <div className="hidden flex-col gap-6 px-8 py-6 md:flex">
        {conflictInfo ? (
          <ConflictDialog
            currentVersion={conflictInfo.currentVersion}
            onDismiss={() => setConflictInfo(null)}
            requestedVersion={conflictInfo.requestedVersion}
          />
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              {issueState.identifier} / Full page
            </p>
            <h1 className="text-[32px] leading-[1.05] font-[var(--app-font-weight-700)] text-[#111318]">
              Issue Full page
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {boardHref ? (
              <Link
                className={getButtonClassName("secondary", "sm")}
                href={boardHref}
              >
                Close detail view
              </Link>
            ) : null}
            <Button
              disabled={isSaving || !hasPendingChanges}
              onClick={saveAllChanges}
              size="sm"
            >
              Save changes
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-[14px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-[#991B1B]">
            {errorMessage}
          </div>
        ) : null}
        {feedbackMessage ? (
          <div className="rounded-[14px] border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3 text-[13px] font-medium text-[#3730A3]">
            {feedbackMessage}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-[var(--app-font-weight-700)] text-[#5E6AD2]">
                      {issueState.identifier}
                    </span>
                  </div>
                  <label className="sr-only" htmlFor="full-issue-title">
                    Title
                  </label>
                  <Field
                    className="mt-3 h-auto border-0 bg-transparent px-0 text-[32px] leading-[1.1] font-[var(--app-font-weight-700)] text-[#111318] shadow-none focus-visible:ring-0"
                    id="full-issue-title"
                    onChange={(event) => setTitleDraft(event.target.value)}
                    value={titleDraft}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-[6px]">
                  <label
                    className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
                    htmlFor="full-issue-status"
                  >
                    Status
                  </label>
                  <Select
                    id="full-issue-status"
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
                    className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
                    htmlFor="full-issue-priority"
                  >
                    Priority
                  </label>
                  <Select
                    id="full-issue-priority"
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
                    className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
                    htmlFor="full-issue-assignee"
                  >
                    Assignee
                  </label>
                  <Select
                    id="full-issue-assignee"
                    onValueChange={setAssigneeDraft}
                    value={assigneeDraft}
                  >
                    {assigneeOptions.map((option) => (
                      <option
                        key={option.value || "unassigned"}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <DueDateField
                  id="full-issue-dueDate"
                  label="Due Date"
                  value={dueDateDraft}
                  onChange={setDueDateDraft}
                />
              </div>

              <div className="mt-4">
                <LabelSelector
                  availableLabels={availableLabels.map((label) => ({
                    id: label.id,
                    name: label.name,
                    color: label.color,
                  }))}
                  selectedLabelIds={selectedLabelIds}
                  onLabelToggle={handleLabelToggle}
                  onCreateLabel={handleCreateLabel}
                  disabled={isSaving}
                  placeholder="Select labels"
                />
              </div>
            </section>

            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
                  Description
                </h2>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="outline">
                    Product
                  </Chip>
                  <Chip size="sm" variant="outline">
                    Editing
                  </Chip>
                </div>
              </div>

              <MarkdownEditor
                value={descriptionDraft}
                onChange={setDescriptionDraft}
                placeholder="이슈에 대한 자세한 설명을 작성해주세요..."
                minHeight="240px"
                className="mt-4"
              />
            </section>

            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
                  Comments
                </h2>
                <span className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
                  {commentsState.length} items
                </span>
              </div>

              <div className="mt-4 rounded-[12px] border border-[#E6E8EC] bg-[#FCFCFD] p-4">
                <label
                  className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]"
                  htmlFor="issue-comment-draft"
                >
                  New comment
                </label>
                <MarkdownEditor
                  value={commentDraft}
                  onChange={setCommentDraft}
                  placeholder="댓글을 입력하세요..."
                  minHeight="96px"
                  className="mt-2"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    disabled={isSaving || commentDraft.trim().length === 0}
                    onClick={submitComment}
                    size="sm"
                    variant="secondary"
                  >
                    Post comment
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {commentsState.length > 0 ? (
                  commentsState.map((comment) => (
                    <div
                      className="rounded-[12px] border border-[#E6E8EC] bg-white px-4 py-3"
                      key={comment.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-[var(--app-font-weight-700)] text-[#111318]">
                          {memberNamesById[comment.authorId] ??
                            comment.authorId}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#6B7280]">
                            {formatTimestamp(comment.createdAt)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              className="rounded p-1 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111318]"
                              onClick={() =>
                                startEditComment(comment.id, comment.body)
                              }
                              title="Edit comment"
                              type="button"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="rounded p-1 text-[#6B7280] transition-colors hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                              onClick={() => deleteComment(comment.id)}
                              title="Delete comment"
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-3 flex flex-col gap-3">
                          <MarkdownEditor
                            value={editingCommentBody}
                            onChange={setEditingCommentBody}
                            placeholder="Edit your comment..."
                            minHeight="96px"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              disabled={isSaving}
                              onClick={cancelEditComment}
                              size="sm"
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={
                                isSaving ||
                                editingCommentBody.trim().length === 0
                              }
                              onClick={() => saveCommentEdit(comment.id)}
                              size="sm"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="prose prose-sm max-w-none mt-2 text-[13px] leading-6 text-[#374151]"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: User-generated markdown content
                          dangerouslySetInnerHTML={{ __html: comment.body }}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[12px] border border-dashed border-[#D7DCE5] bg-[#FCFCFD] px-4 py-5 text-[13px] text-[#6B7280]">
                    No comments yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <h2 className="text-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
                Metadata
              </h2>
              <div className="mt-4 grid gap-3">
                <MetadataRow
                  label="Created"
                  value={formatTimestamp(issueState.createdAt)}
                />
                <MetadataRow
                  label="Updated"
                  value={formatTimestamp(issueState.updatedAt)}
                />
                <MetadataRow label="Status" value={issueState.status} />
                <MetadataRow
                  label="Priority"
                  toneClassName={getPriorityTone(issueState.priority)}
                  value={issueState.priority}
                />
                <MetadataRow label="Assignee" value={assigneeLabel} />
                <MetadataRow label="Last editor" value={lastEditedByLabel} />
              </div>
            </section>

            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
                  Activity log
                </h2>
                <span className="text-[11px] text-[#6B7280]">Latest</span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {activityState.length > 0 ? (
                  activityState.slice(0, 4).map((entry) => (
                    <div key={entry.id}>
                      <p className="text-[12px] font-[var(--app-font-weight-700)] text-[#111318]">
                        {entry.summary}
                      </p>
                      <p className="mt-1 text-[11px] font-[var(--app-font-weight-600)] text-[#374151]">
                        {memberNamesById[entry.actorId] ?? entry.actorId}
                      </p>
                      <p className="mt-1 text-[11px] text-[#6B7280]">
                        {formatTimestamp(entry.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-[#6B7280]">
                    No activity yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[16px] border border-[#FDBA74] bg-[#FFF7ED] p-4">
              <h2 className="text-[14px] font-[var(--app-font-weight-700)] text-[#9A3412]">
                Failure / fallback & Memo
              </h2>
              <p className="mt-3 text-[12px] leading-5 text-[#9A3412]">
                {getFailureMemo(issueState)}
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MetadataRow({
  label,
  toneClassName,
  value,
}: {
  label: string;
  toneClassName?: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
        {label}
      </span>
      <span className={toneClassName ?? "text-[#111318]"}>{value}</span>
    </div>
  );
}
