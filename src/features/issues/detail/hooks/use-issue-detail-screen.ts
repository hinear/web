"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  isCommentCreateResponse,
  isConflictError,
  isIssueUpdateResponse,
} from "@/features/issues/detail/lib/issue-detail-guards";
import {
  getMutationErrorCode,
  getMutationErrorFallbackMessage,
  getMutationErrorMessage,
} from "@/features/issues/lib/mutation-error-messages";
import type { ActivityLogEntry, Comment, Issue } from "@/features/issues/types";
import { hasMeaningfulRichTextContent } from "@/lib/rich-text";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface UseIssueDetailScreenProps {
  boardHref?: string;
  issue: Issue;
  comments?: Comment[];
  activityLog?: ActivityLogEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_COMMENTS: Comment[] = [];
const EMPTY_ACTIVITY_LOG: ActivityLogEntry[] = [];

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseIssueDetailScreenReturn {
  // State values
  activityState: ActivityLogEntry[];
  assigneeDraft: string;
  commentDraft: string;
  commentsState: Comment[];
  conflictInfo: {
    currentVersion: number;
    requestedVersion: number;
  } | null;
  descriptionDraft: string;
  dueDateDraft: string;
  hasCommentContent: boolean;
  hasDescriptionContent: boolean;
  isCommentComposerOpen: boolean;
  isDescriptionEditorOpen: boolean;
  isSaving: boolean;
  issueState: Issue;
  priorityDraft: Issue["priority"];
  statusDraft: Issue["status"];
  titleDraft: string;

  // Setters
  setAssigneeDraft: (value: string) => void;
  setCommentDraft: (value: string) => void;
  setCommentComposerOpen: (open: boolean) => void;
  setConflictInfo: (
    info: { currentVersion: number; requestedVersion: number } | null
  ) => void;
  setDescriptionDraft: (value: string) => void;
  setDescriptionEditorOpen: (open: boolean) => void;
  setDueDateDraft: (value: string) => void;
  setPriorityDraft: (value: Issue["priority"]) => void;
  setStatusDraft: (value: Issue["status"]) => void;
  setTitleDraft: (value: string) => void;

  // Event handlers
  handleDeleteIssue: () => void;
  saveIssueUpdates: (
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
  ) => void;
  submitComment: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useIssueDetailScreen({
  boardHref,
  issue,
  comments = EMPTY_COMMENTS,
  activityLog = EMPTY_ACTIVITY_LOG,
}: UseIssueDetailScreenProps): UseIssueDetailScreenReturn {
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Core state
  // ---------------------------------------------------------------------------

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

  const [isDescriptionEditorOpen, setDescriptionEditorOpen] = useState(false);
  const [isCommentComposerOpen, setCommentComposerOpen] = useState(false);

  const [conflictInfo, setConflictInfo] = useState<{
    currentVersion: number;
    requestedVersion: number;
  } | null>(null);

  const [isSaving, startSavingTransition] = useTransition();

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const hasDescriptionContent = hasMeaningfulRichTextContent(descriptionDraft);
  const hasCommentContent = hasMeaningfulRichTextContent(commentDraft);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  function saveIssueUpdates(
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
  ) {
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
  }

  function submitComment() {
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
  }

  function handleDeleteIssue() {
    if (
      !confirm(
        "Are you sure you want to delete this issue? This action cannot be undone."
      )
    ) {
      return;
    }

    startSavingTransition(async () => {
      try {
        const response = await fetch(`/internal/issues/${issueState.id}`, {
          method: "DELETE",
        });

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

        if (boardHref) {
          router.push(boardHref);
          router.refresh();
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete issue."
        );
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State values
    activityState,
    assigneeDraft,
    commentDraft,
    commentsState,
    conflictInfo,
    descriptionDraft,
    dueDateDraft,
    hasCommentContent,
    hasDescriptionContent,
    isCommentComposerOpen,
    isDescriptionEditorOpen,
    isSaving,
    issueState,
    priorityDraft,
    statusDraft,
    titleDraft,

    // Setters
    setAssigneeDraft,
    setCommentDraft,
    setCommentComposerOpen,
    setConflictInfo,
    setDescriptionDraft,
    setDescriptionEditorOpen,
    setDueDateDraft,
    setPriorityDraft,
    setStatusDraft,
    setTitleDraft,

    // Event handlers
    handleDeleteIssue,
    saveIssueUpdates,
    submitComment,
  };
}
