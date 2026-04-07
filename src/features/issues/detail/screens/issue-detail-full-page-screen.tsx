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

import { Button, getButtonClassName } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { ConflictDialog } from "@/components/molecules/ConflictDialog";
import { DueDateField } from "@/components/molecules/DueDateField";
import { LabelSelector } from "@/components/molecules/LabelSelector";
import { MarkdownEditor } from "@/components/molecules/MarkdownEditor";
import { IssueActivityItem } from "@/features/issues/detail/components/IssueActivityItem";
import { IssueCommentMeta } from "@/features/issues/detail/components/IssueCommentMeta";
import { IssueDateMeta } from "@/features/issues/detail/components/IssueDateMeta";
import { IssueFieldBlock } from "@/features/issues/detail/components/IssueFieldBlock";
import { IssueIdentifierBadge } from "@/features/issues/detail/components/IssueIdentifierBadge";
import { IssueMetaRow } from "@/features/issues/detail/components/IssueMetaRow";
import { IssuePanel } from "@/features/issues/detail/components/IssuePanel";
import { IssuePriorityBadge } from "@/features/issues/detail/components/IssuePriorityBadge";
import { IssueSectionHeader } from "@/features/issues/detail/components/IssueSectionHeader";
import { IssueStatusBadge } from "@/features/issues/detail/components/IssueStatusBadge";
import { useIssueDetailEditor } from "@/features/issues/detail/hooks/use-issue-detail-editor";
import { IssueAssigneePill } from "@/features/issues/shared/components/IssueAssigneePill";
import { IssueEmptyState } from "@/features/issues/shared/components/IssueEmptyState";
import { IssueLabelChip } from "@/features/issues/shared/components/IssueLabelChip";
import type {
  ActivityLogEntry,
  Comment,
  Issue,
  Label,
} from "@/features/issues/types";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";
import { usePerformanceProfiler } from "@/features/performance/hooks/usePerformanceProfiler";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_COMMENTS: Comment[] = [];
const EMPTY_ACTIVITY_LOG: ActivityLogEntry[] = [];
const EMPTY_LABELS: Label[] = [];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IssueDetailFullPageScreen({
  activityLog = EMPTY_ACTIVITY_LOG,
  assigneeOptions: assigneeOptionsProp = [],
  availableLabels = EMPTY_LABELS,
  boardHref,
  comments = EMPTY_COMMENTS,
  githubRepository = null,
  initialNow,
  issue,
  memberNamesById = {},
}: IssueDetailFullPageScreenProps) {
  // Enable performance profiling for issue detail pages (1% sampling in production)
  usePerformanceProfiler(process.env.NODE_ENV === "production");

  const {
    activityState,
    assigneeDraft,
    assigneeLabel,
    assigneeOptions,
    availableLabels: editorAvailableLabels,
    boardHref: editorBoardHref,
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
    githubRepository: editorGithubRepository,
    hasCommentContent,
    hasEditingCommentContent,
    hasPendingChanges,
    isBranchTitleValid,
    isGitHubPending,
    isSaving,
    issueState,
    lastEditedByLabel,
    memberNamesById: editorMemberNamesById,
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
  } = useIssueDetailEditor({
    activityLog,
    assigneeOptions: assigneeOptionsProp,
    availableLabels,
    boardHref,
    comments,
    githubRepository,
    initialNow,
    issue,
    memberNamesById,
  });

  const gitHubWorkflowCard = editorGithubRepository ? (
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
            {editorGithubRepository.owner}/{editorGithubRepository.name}
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

      {/* ----------------------------------------------------------------- */}
      {/* Mobile layout                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 px-4 py-4 md:hidden">
        {conflictInfo ? (
          <ConflictDialog
            currentVersion={conflictInfo.currentVersion}
            onDismiss={() => setConflictInfo(null)}
            requestedVersion={conflictInfo.requestedVersion}
          />
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {editorBoardHref ? (
              <Link
                aria-label="Back to board"
                className="inline-flex h-4 w-4 items-center justify-center text-[#111318]"
                href={editorBoardHref}
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
                        editorMemberNamesById[comment.authorId] ??
                        comment.authorId
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
                        issueId={issueState.id}
                        value={editingCommentBody}
                        onChange={setEditingCommentBody}
                        placeholder="Edit your comment..."
                        minHeight="96px"
                        projectId={issueState.projectId}
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
                          disabled={isSaving || !hasEditingCommentContent}
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
            issueId={issueState.id}
            value={commentDraft}
            onChange={setCommentDraft}
            placeholder="댓글을 입력하세요..."
            minHeight="44px"
            projectId={issueState.projectId}
          />
          <div className="flex justify-end">
            <Button
              disabled={isSaving || !hasCommentContent}
              loading={isSaving}
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
            {editorMemberNamesById[issueState.createdBy] ??
              issueState.createdBy}{" "}
            · Last editor {lastEditedByLabel}
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
                  actorLabel={
                    editorMemberNamesById[entry.actorId] ?? entry.actorId
                  }
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

      {/* ----------------------------------------------------------------- */}
      {/* Desktop layout                                                     */}
      {/* ----------------------------------------------------------------- */}
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
            {editorBoardHref ? (
              <Link
                className={getButtonClassName("secondary", "sm")}
                href={editorBoardHref}
              >
                Close detail view
              </Link>
            ) : null}
            <Button
              disabled={isSaving || !hasPendingChanges}
              loading={isSaving}
              onClick={saveAllChanges}
              size="sm"
            >
              Save changes
            </Button>
          </div>
        </div>

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
                  availableLabels={editorAvailableLabels.map((label) => ({
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
                issueId={issueState.id}
                value={descriptionDraft}
                onChange={setDescriptionDraft}
                placeholder="이슈에 대한 자세한 설명을 작성해주세요..."
                minHeight="240px"
                className="mt-4"
                projectId={issueState.projectId}
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
                  issueId={issueState.id}
                  value={commentDraft}
                  onChange={setCommentDraft}
                  placeholder="댓글을 입력하세요..."
                  minHeight="96px"
                  className="mt-2"
                  projectId={issueState.projectId}
                />
                <p className="mt-2 text-[12px] leading-[1.45] text-[#6B7280]">
                  Post updates here so the latest context is visible to everyone
                  reviewing this issue.
                </p>
                <div className="mt-3 flex justify-end">
                  <Button
                    disabled={isSaving || !hasCommentContent}
                    loading={isSaving}
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
                            editorMemberNamesById[comment.authorId] ??
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
                            issueId={issueState.id}
                            value={editingCommentBody}
                            onChange={setEditingCommentBody}
                            placeholder="Edit your comment..."
                            minHeight="96px"
                            projectId={issueState.projectId}
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
                              disabled={isSaving || !hasEditingCommentContent}
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
                          editorMemberNamesById[entry.actorId] ?? entry.actorId
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
                <p className="mt-2 text-[12px] leading-[1.45] text-red-700">
                  Deleting removes the issue from the board and closes this
                  detail view after the server confirms the change.
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
