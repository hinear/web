"use client";

import { X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { DueDateField } from "@/components/molecules/DueDateField";
import { LabelSelector } from "@/components/molecules/LabelSelector";
import { MarkdownEditor } from "@/components/molecules/MarkdownEditor";
import { createLabelAction } from "@/features/issues/actions/create-label-action";
import { getLabelsAction } from "@/features/issues/actions/get-labels-action";
import { createLabelKey, getLabelColor } from "@/features/issues/lib/labels";
import type { Label } from "@/features/issues/types";
import { cn } from "@/lib/utils";

interface SelectOption {
  label: string;
  value: string;
}

interface CreateIssueTabletModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  action?: React.ComponentProps<"form">["action"];
  assigneeOptions?: SelectOption[];
  defaultDescription?: string;
  defaultDueDate?: string | null;
  defaultLabels?: string | string[];
  defaultPriority?: string;
  defaultStatus?: string;
  defaultTitle?: string;
  onCancel?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onClose?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  priorityOptions?: SelectOption[];
  projectId?: string;
  statusOptions?: SelectOption[];
}

const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
  { label: "Triage", value: "Triage" },
  { label: "Backlog", value: "Backlog" },
  { label: "Todo", value: "Todo" },
  { label: "In Progress", value: "In Progress" },
  { label: "Done", value: "Done" },
];

const DEFAULT_PRIORITY_OPTIONS: SelectOption[] = [
  { label: "No priority", value: "No Priority" },
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
  { label: "Urgent", value: "Urgent" },
];

const DEFAULT_ASSIGNEE_OPTIONS: SelectOption[] = [
  { label: "Assign to...", value: "" },
  { label: "Jane Smith", value: "jane-smith" },
  { label: "Alex Kim", value: "alex-kim" },
];

export function CreateIssueTabletModal({
  action,
  assigneeOptions = DEFAULT_ASSIGNEE_OPTIONS,
  className,
  defaultDescription = "# 요약\n이슈의 핵심 내용을 짧게 적어주세요...\n\n- 기대 동작\n- 현재 문제\n- 배포 메모",
  defaultDueDate = null,
  defaultLabels = "",
  defaultPriority = "No Priority",
  defaultStatus = "Triage",
  defaultTitle = "",
  onCancel,
  onClose,
  onSubmit,
  priorityOptions = DEFAULT_PRIORITY_OPTIONS,
  projectId,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  ...props
}: CreateIssueTabletModalProps) {
  // Parse defaultLabels - could be string (comma-separated) or string[]
  const parsedDefaultLabels = React.useMemo(
    () =>
      Array.isArray(defaultLabels)
        ? defaultLabels
        : defaultLabels
          ? defaultLabels
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
    [defaultLabels]
  );

  const [description, setDescription] = React.useState(defaultDescription);
  const [dueDate, setDueDate] = React.useState<string | null>(defaultDueDate);
  const [availableLabels, setAvailableLabels] = React.useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);
  const [title, setTitle] = React.useState(defaultTitle);

  React.useEffect(() => {
    let isMounted = true;

    const fallbackLabels: Label[] = parsedDefaultLabels.map((labelName) => ({
      color: getLabelColor(createLabelKey(labelName)),
      id: `draft:${createLabelKey(labelName)}`,
      name: labelName,
    }));

    if (!projectId) {
      setAvailableLabels(fallbackLabels);
      setSelectedLabelIds(fallbackLabels.map((label) => label.id));
      return () => {
        isMounted = false;
      };
    }

    const currentProjectId = projectId;

    async function loadLabels() {
      const result = await getLabelsAction(currentProjectId);

      if (!isMounted) {
        return;
      }

      const existingLabels = result.success ? result.labels : [];
      const mergedLabels = [
        ...existingLabels,
        ...fallbackLabels.filter(
          (fallbackLabel) =>
            !existingLabels.some(
              (existingLabel) =>
                createLabelKey(existingLabel.name) ===
                createLabelKey(fallbackLabel.name)
            )
        ),
      ];

      setAvailableLabels(mergedLabels);
      setSelectedLabelIds(
        mergedLabels
          .filter((label) =>
            parsedDefaultLabels.some(
              (defaultLabel) =>
                createLabelKey(defaultLabel) === createLabelKey(label.name)
            )
          )
          .map((label) => label.id)
      );
    }

    loadLabels();

    return () => {
      isMounted = false;
    };
  }, [parsedDefaultLabels, projectId]);

  const selectedLabels = availableLabels.filter((label) =>
    selectedLabelIds.includes(label.id)
  );
  const labelsFormValue = selectedLabels.map((label) => label.name).join(", ");

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId]
    );
  };

  const handleCreateLabel = async (name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return;
    }

    if (!projectId) {
      const createdLabel: Label = {
        color: getLabelColor(createLabelKey(normalizedName)),
        id: `draft:${createLabelKey(normalizedName)}`,
        name: normalizedName,
      };

      setAvailableLabels((current) => [...current, createdLabel]);
      setSelectedLabelIds((current) => [...current, createdLabel.id]);
      return;
    }

    const result = await createLabelAction({
      name: normalizedName,
      projectId,
    });

    if (result.success && result.label) {
      toast.success(`Label "${normalizedName}" created`);
      setAvailableLabels((current) => [...current, result.label]);
      setSelectedLabelIds((current) => [...current, result.label.id]);
      return;
    }

    toast.error(result.error || "Failed to create label");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Title 유효성 검사
    if (!title.trim()) {
      e.preventDefault();
      toast.error("Please enter a title.");
      return;
    }

    // 사용자 제출 핸들러 호출
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <div
      className={cn(
        "w-[720px] rounded-[20px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[22px] leading-[22px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
              Create issue
            </h2>
            <p className="mt-1 text-[13px] leading-[1.45] font-normal text-[var(--app-color-gray-500)]">
              board를 벗어나지 않고도 필요한 맥락을 빠르게 적을 수 있습니다.
            </p>
          </div>
          <button
            aria-label="Close modal"
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-50)] text-[var(--app-color-gray-500)]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-[14px] w-[14px]" />
          </button>
        </div>

        <form
          action={action}
          className="flex flex-col gap-5 rounded-[16px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-6"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <label
              className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]"
              htmlFor="create-issue-title"
            >
              Title
            </label>
            <Field
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              id="create-issue-title"
              name="title"
              placeholder="이슈 제목"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]"
                htmlFor="create-issue-status"
              >
                Status
              </label>
              <Select
                defaultValue={defaultStatus}
                id="create-issue-status"
                name="status"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]"
                htmlFor="create-issue-priority"
              >
                Priority
              </label>
              <Select
                defaultValue={defaultPriority}
                id="create-issue-priority"
                name="priority"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]"
                htmlFor="create-issue-assignee"
              >
                Assignee
              </label>
              <Select id="create-issue-assignee" name="assigneeId">
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <DueDateField
                value={dueDate}
                onChange={setDueDate}
                label="Due Date"
                id="create-issue-due-date"
              />
              <input
                id="create-issue-due-date"
                name="dueDate"
                type="hidden"
                value={dueDate ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]"
              htmlFor="create-issue-labels"
            >
              Labels
            </label>
            <div id="create-issue-labels">
              <LabelSelector
                availableLabels={availableLabels.map((label) => ({
                  color: label.color,
                  id: label.id,
                  name: label.name,
                }))}
                onCreateLabel={handleCreateLabel}
                onLabelToggle={handleLabelToggle}
                placeholder="Select labels"
                selectedLabelIds={selectedLabelIds}
              />
            </div>
            <input name="labels" type="hidden" value={labelsFormValue} />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]"
              htmlFor="create-issue-description"
            >
              Description
            </label>

            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="# 요약&#10;이슈의 핵심 내용을 짧게 적어주세요...&#10;&#10;- 기대 동작&#10;- 현재 문제&#10;- 배포 메모"
              minHeight="160px"
            />

            <input
              id="create-issue-description"
              name="description"
              type="hidden"
              value={description}
            />
          </div>

          <div className="flex items-center justify-end gap-[10px]">
            <Button onClick={onCancel} type="button" variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create issue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
