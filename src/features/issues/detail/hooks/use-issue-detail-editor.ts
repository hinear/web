"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { createLabelAction } from "@/features/issues/actions/create-label-action";
import { updateIssueLabelsAction } from "@/features/issues/actions/update-issue-labels-action";
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
import type {
  ActivityLogEntry,
  Comment,
  Issue,
  Label,
} from "@/features/issues/types";

import { getIssueBranchNamePreview } from "@/lib/github/branching";
import { hasMeaningfulRichTextContent } from "@/lib/rich-text";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface UseIssueDetailEditorProps {
  assigneeOptions?: Array<{
    label: string;
    value: string;
  }>;
  availableLabels?: Label[];
  boardHref?: string;
  initialNow: number;
  githubRepository?: {
    owner: string;
    name: string;
  } | null;
  issue: Issue;
  comments?: Comment[];
  activityLog?: ActivityLogEntry[];
  memberNamesById?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Internal response types (not exported from guards)
// ---------------------------------------------------------------------------

interface GitHubBranchResponse {
  branchName: string;
  compareUrl: string;
  created: boolean;
  defaultBranch: string;
  error?: string;
  installUrl?: string | null;
  repositoryFullName: string;
  repositoryUrl: string;
  success?: boolean;
}

export type GitHubBranchIntent = "branch" | "pr";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_COMMENTS: Comment[] = [];
const EMPTY_ACTIVITY_LOG: ActivityLogEntry[] = [];
const EMPTY_LABELS: Label[] = [];

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseIssueDetailEditorReturn {
  // State values
  activityState: ActivityLogEntry[];
  assigneeDraft: string;
  assigneeLabel: string;
  assigneeOptions: Array<{ label: string; value: string }>;
  availableLabels: Label[];
  boardHref: string | undefined;
  branchModalIntent: GitHubBranchIntent | null;
  branchNamePreview: string;
  branchTitleDraft: string;
  commentDraft: string;
  commentsState: Comment[];
  conflictInfo: {
    currentVersion: number;
    requestedVersion: number;
  } | null;
  descriptionDraft: string;
  dueDateDraft: string | null;
  editingCommentBody: string;
  editingCommentId: string | null;
  githubBranchName: string | null;
  githubRepository: {
    owner: string;
    name: string;
  } | null;
  hasCommentContent: boolean;
  hasEditingCommentContent: boolean;
  hasPendingChanges: boolean;
  isBranchTitleValid: boolean;
  isGitHubPending: boolean;
  isSaving: boolean;
  issueState: Issue;
  lastEditedByLabel: string | undefined;
  memberNamesById: Record<string, string>;
  mobileMenuOpen: boolean;
  now: number;
  priorityDraft: Issue["priority"];
  selectedLabelIds: string[];
  statusDraft: Issue["status"];
  titleDraft: string;

  // Setters
  setAssigneeDraft: (value: string) => void;
  setBranchModalIntent: (intent: GitHubBranchIntent | null) => void;
  setBranchTitleDraft: (value: string) => void;
  setCommentDraft: (value: string) => void;
  setConflictInfo: (
    info: { currentVersion: number; requestedVersion: number } | null
  ) => void;
  setDescriptionDraft: (value: string) => void;
  setDueDateDraft: (value: string | null) => void;
  setEditingCommentBody: (value: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setPriorityDraft: (value: Issue["priority"]) => void;
  setStatusDraft: (value: Issue["status"]) => void;
  setTitleDraft: (value: string) => void;

  // Event handlers
  cancelEditComment: () => void;
  deleteComment: (commentId: string) => void;
  ensureGitHubBranch: (openPullRequest: boolean, branchTitle: string) => void;
  handleCreateLabel: (name: string) => Promise<void>;
  handleDeleteIssue: () => void;
  handleLabelToggle: (labelId: string) => void;
  openBranchModal: (intent: GitHubBranchIntent) => void;
  saveAllChanges: () => void;
  saveCommentEdit: (commentId: string) => void;
  startEditComment: (commentId: string, body: string) => void;
  submitComment: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useIssueDetailEditor({
  activityLog = EMPTY_ACTIVITY_LOG,
  assigneeOptions = [],
  availableLabels: availableLabelsProp = EMPTY_LABELS,
  boardHref,
  comments = EMPTY_COMMENTS,
  githubRepository = null,
  initialNow,
  issue,
  memberNamesById = {},
}: UseIssueDetailEditorProps): UseIssueDetailEditorReturn {
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
  const [assigneeDraft, setAssigneeDraft] = useState(issue.assigneeId ?? "");
  const [dueDateDraft, setDueDateDraft] = useState(issue.dueDate);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(() =>
    issue.labels.map((label) => label.id)
  );
  const [availableLabels, setAvailableLabels] =
    useState<Label[]>(availableLabelsProp);

  const [commentDraft, setCommentDraft] = useState("");
  const [now, setNow] = useState(() =>
    Number.isFinite(initialNow) ? initialNow : Date.now()
  );

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");

  const [conflictInfo, setConflictInfo] = useState<{
    currentVersion: number;
    requestedVersion: number;
  } | null>(null);

  const [isSaving, startSavingTransition] = useTransition();
  const [isGitHubPending, startGitHubTransition] = useTransition();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [githubBranchName, setGitHubBranchName] = useState<string | null>(null);
  const [branchModalIntent, setBranchModalIntent] =
    useState<GitHubBranchIntent | null>(null);
  const [branchTitleDraft, setBranchTitleDraft] = useState("");

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setAvailableLabels(availableLabelsProp);
    setSelectedLabelIds(issue.labels.map((label) => label.id));
  }, [issue, availableLabelsProp]);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".mobile-menu-container")) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

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

  useEffect(() => {
    setBranchTitleDraft(issue.title);
  }, [issue.title]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const hasCommentContent = hasMeaningfulRichTextContent(commentDraft);
  const hasEditingCommentContent =
    hasMeaningfulRichTextContent(editingCommentBody);

  const hasPendingChanges =
    titleDraft.trim() !== issueState.title ||
    descriptionDraft !== issueState.description ||
    statusDraft !== issueState.status ||
    priorityDraft !== issueState.priority ||
    assigneeDraft.trim() !== (issueState.assigneeId ?? "") ||
    dueDateDraft !== issueState.dueDate ||
    JSON.stringify([...selectedLabelIds].sort()) !==
      JSON.stringify([...issueState.labels.map((l) => l.id)].sort());

  const assigneeLabel =
    memberNamesById[issueState.assigneeId ?? ""] ??
    issueState.assigneeId ??
    "Unassigned";

  const lastEditedByLabel =
    memberNamesById[issueState.updatedBy] ?? issueState.updatedBy;

  const branchNamePreview = getIssueBranchNamePreview(
    issueState,
    branchTitleDraft
  );
  const isBranchTitleValid = branchTitleDraft.trim().length > 0;

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  const handleLabelToggle = useCallback((labelId: string) => {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId]
    );
  }, []);

  const handleCreateLabel = useCallback(
    async (name: string) => {
      const result = await createLabelAction({
        projectId: issue.projectId,
        name,
      });

      if (result.success && result.label) {
        const created = result.label;
        toast.success(`Label "${name}" created`);
        setAvailableLabels((current) => [...current, created]);
        setSelectedLabelIds((current) => [...current, created.id]);
      } else {
        toast.error(result.error || "Failed to create label");
      }
    },
    [issue.projectId]
  );

  const saveAllChanges = useCallback(() => {
    setConflictInfo(null);

    startSavingTransition(async () => {
      try {
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
        setSelectedLabelIds(data.issue.labels.map((label) => label.id));
        toast.success("Changes saved.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save changes."
        );
      }
    });
  }, [
    issueState.id,
    issueState.projectId,
    issueState.version,
    titleDraft,
    descriptionDraft,
    statusDraft,
    priorityDraft,
    assigneeDraft,
    dueDateDraft,
    selectedLabelIds,
  ]);

  const submitComment = useCallback(() => {
    setConflictInfo(null);

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
  }, [issueState.id, commentDraft]);

  const startEditComment = useCallback((commentId: string, body: string) => {
    setEditingCommentId(commentId);
    setEditingCommentBody(body);
  }, []);

  const cancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentBody("");
  }, []);

  const saveCommentEdit = useCallback(
    (commentId: string) => {
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
    },
    [issueState.id, editingCommentBody, cancelEditComment]
  );

  const deleteComment = useCallback(
    (commentId: string) => {
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
    },
    [issueState.id]
  );

  const handleDeleteIssue = useCallback(() => {
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
  }, [issueState.id, boardHref, router]);

  const ensureGitHubBranch = useCallback(
    (openPullRequest: boolean, branchTitle: string) => {
      startGitHubTransition(async () => {
        try {
          const response = await fetch(
            `/internal/issues/${issueState.id}/github/branch`,
            {
              body: JSON.stringify({
                branchTitle,
              }),
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const data = (await response.json()) as GitHubBranchResponse;

          if (!response.ok || !data.success) {
            if (response.status === 409 && data.installUrl) {
              toast.info("Redirecting to GitHub App installation...");
              window.location.href = data.installUrl;
              return;
            }

            throw new Error(data.error ?? "Failed to prepare GitHub workflow.");
          }

          setGitHubBranchName(data.branchName);
          setBranchModalIntent(null);

          if (openPullRequest) {
            window.open(data.compareUrl, "_blank", "noopener,noreferrer");
            toast.success(`Opened PR flow for ${data.branchName}.`);
            return;
          }

          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(data.branchName);
            toast.success(
              data.created
                ? `Branch ${data.branchName} created and copied.`
                : `Branch ${data.branchName} is ready and copied.`
            );
            return;
          }

          toast.success(
            data.created
              ? `Branch ${data.branchName} created.`
              : `Branch ${data.branchName} is ready.`
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to prepare GitHub workflow."
          );
        }
      });
    },
    [issueState.id]
  );

  const openBranchModal = useCallback(
    (intent: GitHubBranchIntent) => {
      setBranchTitleDraft(issueState.title);
      setBranchModalIntent(intent);
    },
    [issueState.title]
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State values
    activityState,
    assigneeDraft,
    assigneeLabel,
    assigneeOptions,
    availableLabels,
    boardHref,
    branchModalIntent,
    branchNamePreview,
    branchTitleDraft,
    commentDraft,
    commentsState,
    conflictInfo,
    descriptionDraft,
    dueDateDraft,
    editingCommentBody,
    editingCommentId,
    githubBranchName,
    githubRepository,
    hasCommentContent,
    hasEditingCommentContent,
    hasPendingChanges,
    isBranchTitleValid,
    isGitHubPending,
    isSaving,
    issueState,
    lastEditedByLabel,
    memberNamesById,
    mobileMenuOpen,
    now,
    priorityDraft,
    selectedLabelIds,
    statusDraft,
    titleDraft,

    // Setters
    setAssigneeDraft,
    setBranchModalIntent,
    setBranchTitleDraft,
    setCommentDraft,
    setConflictInfo,
    setDescriptionDraft,
    setDueDateDraft,
    setEditingCommentBody,
    setMobileMenuOpen,
    setPriorityDraft,
    setStatusDraft,
    setTitleDraft,

    // Event handlers
    cancelEditComment,
    deleteComment,
    ensureGitHubBranch,
    handleCreateLabel,
    handleDeleteIssue,
    handleLabelToggle,
    openBranchModal,
    saveAllChanges,
    saveCommentEdit,
    startEditComment,
    submitComment,
  };
}
