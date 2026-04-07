import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { createLabelAction } from "@/features/issues/actions/create-label-action";
import { updateIssueLabelsAction } from "@/features/issues/actions/update-issue-labels-action";
import {
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
  ConflictError,
  Issue,
  Label,
} from "@/features/issues/types";

interface UseIssueDrawerEditorParams {
  activityLog?: ActivityLogEntry[];
  availableLabels?: Label[];
  issue: Issue;
}

const EMPTY_ACTIVITY_LOG: ActivityLogEntry[] = [];
const EMPTY_LABELS: Label[] = [];

export interface UseIssueDrawerEditorReturn {
  activityState: ActivityLogEntry[];
  assigneeDraft: string;
  availableLabels: Label[];
  conflictInfo: {
    currentVersion: number;
    requestedVersion: number;
  } | null;
  descriptionDraft: string;
  dismissConflict: () => void;
  dueDateDraft: string | null;
  handleCreateLabel: (name: string) => Promise<void>;
  handleLabelToggle: (labelId: string) => void;
  hasPendingChanges: boolean;
  isSaving: boolean;
  issueState: Issue;
  now: number;
  priorityDraft: Issue["priority"];
  saveChanges: () => void;
  selectedLabelIds: string[];
  setAssigneeDraft: (value: string) => void;
  setDescriptionDraft: (value: string) => void;
  setDueDateDraft: (value: string | null) => void;
  setPriorityDraft: (value: Issue["priority"]) => void;
  setStatusDraft: (value: Issue["status"]) => void;
  setTitleDraft: (value: string) => void;
  statusDraft: Issue["status"];
  titleDraft: string;
  visibleActivity: ActivityLogEntry[];
}

export function useIssueDrawerEditor({
  activityLog = EMPTY_ACTIVITY_LOG,
  availableLabels: availableLabelsProp = EMPTY_LABELS,
  issue,
}: UseIssueDrawerEditorParams): UseIssueDrawerEditorReturn {
  const [issueState, setIssueState] = useState(issue);
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
  const [now] = useState(() => Date.now());
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
    setSelectedLabelIds(issue.labels.map((label) => label.id));
  }, [activityLog, issue]);

  useEffect(() => {
    setAvailableLabels(availableLabelsProp);
    setSelectedLabelIds(issue.labels.map((label) => label.id));
  }, [availableLabelsProp, issue]);

  const hasPendingChanges =
    titleDraft.trim() !== issueState.title ||
    descriptionDraft !== issueState.description ||
    statusDraft !== issueState.status ||
    priorityDraft !== issueState.priority ||
    assigneeDraft.trim() !== (issueState.assigneeId ?? "") ||
    dueDateDraft !== issueState.dueDate ||
    JSON.stringify([...selectedLabelIds].sort()) !==
      JSON.stringify([...issueState.labels.map((label) => label.id)].sort());

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
      const created = result.label;
      toast.success(`Label "${name}" created`);
      setAvailableLabels((current) => [...current, created]);
      setSelectedLabelIds((current) => [...current, created.id]);
      return;
    }

    toast.error(result.error || "Failed to create label");
  };

  function saveChanges() {
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
            const conflict = data as ConflictError;
            setIssueState(conflict.currentIssue);
            setTitleDraft(conflict.currentIssue.title);
            setDescriptionDraft(conflict.currentIssue.description);
            setStatusDraft(conflict.currentIssue.status);
            setPriorityDraft(conflict.currentIssue.priority);
            setAssigneeDraft(conflict.currentIssue.assigneeId ?? "");
            setDueDateDraft(conflict.currentIssue.dueDate);
            setConflictInfo({
              currentVersion: conflict.currentVersion,
              requestedVersion: conflict.requestedVersion,
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

  const dismissConflict = () => setConflictInfo(null);

  const visibleActivity = activityState.slice(0, 3);

  return {
    activityState,
    assigneeDraft,
    availableLabels,
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
  };
}
