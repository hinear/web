"use client";

import {
  ChevronLeft,
  Ellipsis,
  GitBranch,
  Github,
  Pencil,
  Trash2,
} from "lucide-react";
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
import { IssueActivityItem } from "@/features/issues/components/IssueActivityItem";
import { IssueAssigneePill } from "@/features/issues/components/IssueAssigneePill";
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
  Label,
} from "@/features/issues/types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";
import { getIssueBranchNamePreview } from "@/lib/github/branching";

interface IssueDetailFullPageScreenProps {
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

interface IssueUpdateResponse {
  activityLog: ActivityLogEntry[];
  issue: Issue;
}

interface CommentCreateResponse {
  activityEntry: ActivityLogEntry;
  comment: Comment;
}

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

type GitHubBranchIntent = "branch" | "pr";

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

export function IssueDetailFullPageScreen({
  activityLog = EMPTY_ACTIVITY_LOG,
  assigneeOptions = [],
  availableLabels: availableLabelsProp = [],
  boardHref,
  comments = EMPTY_COMMENTS,
  githubRepository = null,
  initialNow,
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
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(() =>
    issue.labels.map((label) => label.id)
  );
  const [availableLabels, setAvailableLabels] =
    useState<Label[]>(availableLabelsProp);
  const [commentDraft, setCommentDraft] = useState("");
  const [now, setNow] = useState(() =>
    Number.isFinite(initialNow) ? initialNow : Date.now()
  );

  useEffect(() => {
    setAvailableLabels(availableLabelsProp);
    setSelectedLabelIds(issue.labels.map((label) => label.id));
  }, [issue, availableLabelsProp]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      // 새 라벨을 목록에 추가하고 자동으로 선택
      setAvailableLabels((current) => [...current, result.label]);
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

        // Redirect to project page after a short delay
        setTimeout(() => {
          if (boardHref) {
            window.location.href = boardHref;
          }
        }, 500);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete issue."
        );
      }
    });
  };

  const ensureGitHubBranch = (
    openPullRequest: boolean,
    branchTitle: string
  ) => {
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
  };

  const branchNamePreview = getIssueBranchNamePreview(
    issueState,
    branchTitleDraft
  );
  const isBranchTitleValid = branchTitleDraft.trim().length > 0;

  const openBranchModal = (intent: GitHubBranchIntent) => {
    setBranchTitleDraft(issueState.title);
    setBranchModalIntent(intent);
  };

  const gitHubWorkflowCard = githubRepository ? (
    <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-[var(--app-font-weight-700)] text-[#5E6AD2]">
              GitHub workflow
            </p>
            <h2 className="mt-1 text-[16px] font-[var(--app-font-weight-600)] text-[#111318]">
              Branch and PR
            </h2>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#6B7280]">
              Create an issue branch from the repository default branch, then
              open the GitHub compare page after you push commits.
            </p>
          </div>
          <div className="rounded-full border border-[#E6E8EC] bg-[#FCFCFD] px-3 py-1 text-[11px] font-[var(--app-font-weight-600)] text-[#4B5563]">
            {githubRepository.owner}/{githubRepository.name}
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-[var(--app-font-weight-600)] text-[#111318]">
            <GitBranch className="h-4 w-4 text-[#5E6AD2]" />
            <span>
              {githubBranchName ??
                "Branch name will be generated from this issue."}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-[1.5] text-[#6B7280]">
            Branches follow the issue key and title, like{" "}
            <span className="font-mono">{branchNamePreview}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={isGitHubPending}
            onClick={() => openBranchModal("branch")}
            size="sm"
            variant="secondary"
          >
            <GitBranch className="mr-2 h-4 w-4" />
            {isGitHubPending ? "Preparing..." : "Create branch"}
          </Button>
          <Button
            disabled={isGitHubPending}
            onClick={() => openBranchModal("pr")}
            size="sm"
          >
            <Github className="mr-2 h-4 w-4" />
            {isGitHubPending ? "Preparing..." : "Open PR"}
          </Button>
        </div>
      </div>
    </section>
  ) : null;

  return (
    <main className="min-h-screen bg-[#FCFCFD]">
      {branchModalIntent ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10">
          <button
            aria-label="Close GitHub branch modal"
            className="absolute inset-0 bg-[rgba(15,23,42,0.36)]"
            onClick={() => setBranchModalIntent(null)}
            type="button"
          />
          <div className="relative z-10 w-full max-w-[560px] rounded-[24px] border border-[#E6E8EC] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-[var(--app-font-weight-700)] text-[#5E6AD2]">
                  GitHub branch name
                </p>
                <h2 className="mt-1 text-[24px] leading-[1.1] font-[var(--app-font-weight-700)] text-[#111318]">
                  {branchModalIntent === "pr"
                    ? "Name the branch before opening PR"
                    : "Name the branch before creating it"}
                </h2>
                <p className="mt-2 text-[14px] leading-[1.5] text-[#6B7280]">
                  The branch format is fixed to prefix, issue number, and your
                  custom title.
                </p>
              </div>
              <button
                className="rounded-[10px] border border-[#E6E8EC] px-3 py-2 text-[12px] font-[var(--app-font-weight-600)] text-[#6B7280] hover:bg-[#F8FAFC]"
                onClick={() => setBranchModalIntent(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-[12px] font-[var(--app-font-weight-700)] text-[#111318]"
                  htmlFor="github-branch-title"
                >
                  Custom branch title
                </label>
                <Field
                  id="github-branch-title"
                  onChange={(event) => setBranchTitleDraft(event.target.value)}
                  placeholder="for example fix-login-redirect"
                  value={branchTitleDraft}
                />
                <p className="text-[12px] leading-[1.5] text-[#6B7280]">
                  Use a short working title. We will slugify it automatically.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4">
                <p className="text-[11px] font-[var(--app-font-weight-700)] tracking-[0.08em] text-[#6B7280] uppercase">
                  Preview
                </p>
                <p className="mt-2 font-mono text-[14px] text-[#111318]">
                  {branchNamePreview}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => setBranchModalIntent(null)}
                  size="sm"
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isGitHubPending || !isBranchTitleValid}
                  onClick={() =>
                    ensureGitHubBranch(
                      branchModalIntent === "pr",
                      branchTitleDraft
                    )
                  }
                  size="sm"
                >
                  {isGitHubPending
                    ? "Preparing..."
                    : branchModalIntent === "pr"
                      ? "Continue to PR"
                      : "Create branch"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

          <div className="relative mobile-menu-container">
            <button
              aria-label="More issue actions"
              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E6E8EC] bg-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
            >
              <Ellipsis
                aria-hidden="true"
                className="h-[14px] w-[14px] text-[#6B7280]"
              />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-[#E6E8EC] bg-white shadow-lg">
                <button
                  className="flex w-full items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-left text-[13px] font-medium text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleDeleteIssue();
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4 flex-shrink-0" />
                  <span>Delete issue</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <IssuePanel className="flex flex-col gap-3">
          <IssueIdentifierBadge identifier={issueState.identifier} size="sm" />
          <h2 className="text-[20px] leading-[1.25] font-[var(--app-font-weight-600)] text-[#111318]">
            {issueState.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <IssueStatusBadge size="sm" status={issueState.status} />
            <IssuePriorityBadge priority={issueState.priority} size="sm" />
          </div>
          <p className="text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#6B7280]">
            {assigneeLabel} assigned ·{" "}
            <IssueDateMeta
              now={now}
              value={issueState.updatedAt}
              variant="relative"
            />{" "}
            updated
          </p>
        </IssuePanel>

        {gitHubWorkflowCard}

        <IssuePanel className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-[var(--app-font-weight-600)] text-[#111318]">
              Description
            </h2>
            <span className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              Markdown
            </span>
          </div>
          <div
            className="prose prose-sm max-w-none text-[13px] leading-[1.5] text-[#111318]"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: TipTap editor generates safe HTML
            dangerouslySetInnerHTML={{
              __html: issueState.description || "<p>No description yet.</p>",
            }}
          />
          {issueState.labels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {issueState.labels.map((label) => (
                <IssueLabelChip key={label.id} label={label} size="sm" />
              ))}
            </div>
          ) : null}
        </IssuePanel>

        <section className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EC] bg-white p-4">
          <IssueSectionHeader
            title="Comments"
            titleClassName="text-[14px] font-[var(--app-font-weight-600)]"
          />
          {commentsState.length > 0 ? (
            <div className="flex flex-col gap-3">
              {commentsState.map((comment) => (
                <div
                  className="rounded-[14px] border border-[#E6E8EC] bg-[#FCFCFD] px-[18px] py-4"
                  key={comment.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <IssueCommentMeta
                      authorLabel={
                        memberNamesById[comment.authorId] ?? comment.authorId
                      }
                      className="[&_span:first-child]:text-[11px] [&_span:first-child]:font-[var(--app-font-weight-600)] [&_span:last-child]:text-[11px]"
                      createdAt={comment.createdAt}
                      dateVariant="relative"
                      now={now}
                    />
                    <div className="flex items-center gap-2">
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
                            isSaving || editingCommentBody.trim().length === 0
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
                      className="prose prose-sm max-w-none mt-2 text-[13px] leading-[1.45] text-[#4B5563]"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: User-generated markdown content
                      dangerouslySetInnerHTML={{ __html: comment.body }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <IssueEmptyState
              className="text-[13px] leading-[1.45] text-[#6B7280]"
              message="No comments yet."
            />
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
          <IssueSectionHeader
            badge={
              <Chip size="sm" variant="neutral">
                Summary
              </Chip>
            }
            title="Metadata"
            titleClassName="text-[14px] font-[var(--app-font-weight-600)]"
          />
          <p className="whitespace-pre-wrap text-[11px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#4B5563]">
            Created <IssueDateMeta value={issueState.createdAt} /> · Updated{" "}
            <IssueDateMeta
              now={now}
              value={issueState.updatedAt}
              variant="relative"
            />
            {"\n"}Author{" "}
            {memberNamesById[issueState.createdBy] ?? issueState.createdBy} ·{" "}
            Last editor {lastEditedByLabel}
          </p>
        </section>

        <section className="flex flex-col gap-2 rounded-[16px] border border-[#E6E8EC] bg-white p-[14px]">
          <IssueSectionHeader
            badge={
              <span className="text-[11px] font-[var(--app-font-weight-700)] text-[#4338CA]">
                View full history
              </span>
            }
            title="Recent activity"
            titleClassName="text-[13px] font-[var(--app-font-weight-600)]"
          />
          {activityState.length > 0 ? (
            activityState
              .slice(0, 2)
              .map((entry) => (
                <IssueActivityItem
                  actorLabel={memberNamesById[entry.actorId] ?? entry.actorId}
                  className="rounded-[12px] bg-[#FCFCFD] px-3 py-[10px]"
                  key={entry.id}
                  createdAt={entry.createdAt}
                  dateVariant="relative"
                  now={now}
                  summary={entry.summary}
                  variant="plain"
                />
              ))
          ) : (
            <IssueEmptyState
              className="text-[12px] text-[#6B7280]"
              message="No activity yet."
            />
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
            {gitHubWorkflowCard}

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
                <IssueFieldBlock
                  htmlFor="full-issue-status"
                  label="Status"
                  labelClassName="font-[var(--app-font-weight-600)]"
                >
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
                </IssueFieldBlock>

                <IssueFieldBlock
                  htmlFor="full-issue-priority"
                  label="Priority"
                  labelClassName="font-[var(--app-font-weight-600)]"
                >
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
                </IssueFieldBlock>

                <IssueFieldBlock
                  htmlFor="full-issue-assignee"
                  label="Assignee"
                  labelClassName="font-[var(--app-font-weight-600)]"
                >
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
                </IssueFieldBlock>

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
              <h2 className="text-[14px] font-[var(--app-font-weight-700)] text-[#111318]">
                Description
              </h2>

              <MarkdownEditor
                value={descriptionDraft}
                onChange={setDescriptionDraft}
                placeholder="이슈에 대한 자세한 설명을 작성해주세요..."
                minHeight="240px"
                className="mt-4"
              />
            </section>

            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <IssueSectionHeader
                badge={
                  <span className="text-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
                    {commentsState.length} items
                  </span>
                }
                title="Comments"
                titleClassName="text-[14px] font-[var(--app-font-weight-700)]"
              />

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
                        <IssueCommentMeta
                          authorLabel={
                            memberNamesById[comment.authorId] ??
                            comment.authorId
                          }
                          createdAt={comment.createdAt}
                        />
                        <div className="flex items-center gap-3">
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
                  <IssueEmptyState
                    className="rounded-[12px] border border-dashed border-[#D7DCE5] bg-[#FCFCFD] px-4 py-5 text-[13px] text-[#6B7280]"
                    message="No comments yet."
                  />
                )}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <IssueSectionHeader
                title="Metadata"
                titleClassName="text-[14px] font-[var(--app-font-weight-700)]"
              />
              <div className="mt-4 grid gap-3">
                <IssueMetaRow
                  label="Created"
                  value={<IssueDateMeta value={issueState.createdAt} />}
                />
                <IssueMetaRow
                  label="Updated"
                  value={<IssueDateMeta value={issueState.updatedAt} />}
                />
                <IssueMetaRow
                  label="Status"
                  value={
                    <IssueStatusBadge size="sm" status={issueState.status} />
                  }
                />
                <IssueMetaRow
                  label="Priority"
                  value={
                    <IssuePriorityBadge
                      priority={issueState.priority}
                      size="sm"
                    />
                  }
                />
                <IssueMetaRow
                  label="Assignee"
                  value={<IssueAssigneePill name={assigneeLabel} size="sm" />}
                />
                <IssueMetaRow label="Last editor" value={lastEditedByLabel} />
              </div>
            </section>

            <section className="rounded-[16px] border border-[#E6E8EC] bg-white p-4">
              <IssueSectionHeader
                badge={
                  <span className="text-[11px] text-[#6B7280]">Latest</span>
                }
                title="Activity log"
                titleClassName="text-[14px] font-[var(--app-font-weight-700)]"
              />
              <div className="mt-4 flex flex-col gap-3">
                {activityState.length > 0 ? (
                  activityState
                    .slice(0, 4)
                    .map((entry) => (
                      <IssueActivityItem
                        actorLabel={
                          memberNamesById[entry.actorId] ?? entry.actorId
                        }
                        createdAt={entry.createdAt}
                        key={entry.id}
                        summary={entry.summary}
                        variant="plain"
                      />
                    ))
                ) : (
                  <IssueEmptyState
                    className="text-[12px] text-[#6B7280]"
                    message="No activity yet."
                  />
                )}
              </div>
            </section>

            <section className="rounded-[16px] border border-red-200 bg-red-50 p-4">
              <IssueSectionHeader
                title="Danger Zone"
                titleClassName="text-[14px] font-[var(--app-font-weight-700)] text-red-900"
              />
              <div className="mt-4">
                <p className="text-[12px] font-medium text-red-700">
                  Once you delete an issue, there is no going back. Please be
                  certain.
                </p>
                <button
                  className="mt-3 rounded-[10px] bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onClick={handleDeleteIssue}
                  type="button"
                >
                  Delete this issue
                </button>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
