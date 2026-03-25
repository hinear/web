"use client";

import { CalendarDays, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
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

interface MobileIssueCreateScreenProps {
  action?: React.ComponentProps<"form">["action"];
  assigneeOptions?: SelectOption[];
  cancelHref: string;
  className?: string;
  defaultAssigneeId?: string;
  defaultDescription?: string;
  defaultDueDate?: string;
  defaultLabels?: string;
  defaultPriority?: string;
  defaultStatus?: string;
  defaultTitle?: string;
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
];

function formatDueDateLabel(value: string) {
  if (!value) {
    return "Select date";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function MobileDueDateField({
  defaultValue,
  id,
  name,
}: {
  defaultValue: string;
  id: string;
  name: string;
}) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <div className="relative">
      <div className="flex h-[41px] items-center justify-between rounded-[10px] border border-[var(--app-color-border-soft)] bg-white px-[12px] py-[10px]">
        <span
          className={cn(
            "text-[13px] leading-[13px]",
            value
              ? "font-[var(--app-font-weight-500)] text-[#111318]"
              : "font-normal text-[#8A90A2]"
          )}
        >
          {formatDueDateLabel(value)}
        </span>
        <CalendarDays
          aria-hidden="true"
          className="h-[14px] w-[14px] text-[#6B7280]"
        />
      </div>

      <input
        className="absolute inset-0 cursor-pointer opacity-0"
        defaultValue={defaultValue}
        id={id}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        type="date"
      />
    </div>
  );
}

export function MobileIssueCreateScreen({
  action,
  assigneeOptions = DEFAULT_ASSIGNEE_OPTIONS,
  cancelHref,
  className,
  defaultAssigneeId = "",
  defaultDescription = "",
  defaultDueDate = "",
  defaultLabels = "",
  defaultPriority = "No Priority",
  defaultStatus = "Triage",
  defaultTitle = "",
  priorityOptions = DEFAULT_PRIORITY_OPTIONS,
  projectId,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: MobileIssueCreateScreenProps) {
  const formId = React.useId();
  const [description, setDescription] = React.useState(defaultDescription);
  const parsedDefaultLabels = React.useMemo(
    () =>
      defaultLabels
        ? defaultLabels
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean)
        : [],
    [defaultLabels]
  );
  const [availableLabels, setAvailableLabels] = React.useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);

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

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            aria-label="Close new issue"
            className="inline-flex h-4 w-4 items-center justify-center text-[#111318]"
            href={cancelHref}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Link>
          <h1 className="truncate text-[16px] leading-[16px] font-[var(--app-font-weight-600)] text-[#111318]">
            New issue
          </h1>
        </div>

        <button
          className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-[var(--app-color-brand-500)] px-3 py-2 text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-white"
          form={formId}
          type="submit"
        >
          Create
        </button>
      </div>

      <form
        action={action}
        className="flex flex-col gap-3 rounded-[16px] border border-[var(--app-color-border-soft)] bg-white p-4"
        id={formId}
      >
        <div className="flex flex-col gap-2">
          <label
            className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
            htmlFor="mobile-create-issue-title"
          >
            Title
          </label>
          <Field
            className="h-auto rounded-[10px] bg-[#FCFCFD] px-[14px] py-3 text-[13px] leading-[13px]"
            defaultValue={defaultTitle}
            id="mobile-create-issue-title"
            name="title"
            placeholder="이슈 제목"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label
              className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
              htmlFor="mobile-create-issue-status"
            >
              Status
            </label>
            <Select
              className="h-auto rounded-[10px] bg-[#FCFCFD] px-[12px] py-[10px] text-[13px] leading-[13px]"
              defaultValue={defaultStatus}
              id="mobile-create-issue-status"
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
              className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
              htmlFor="mobile-create-issue-priority"
            >
              Priority
            </label>
            <Select
              className="h-auto rounded-[10px] bg-[#FCFCFD] px-[12px] py-[10px] text-[13px] leading-[13px]"
              defaultValue={defaultPriority}
              id="mobile-create-issue-priority"
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
              className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
              htmlFor="mobile-create-issue-assignee"
            >
              Assignee
            </label>
            <Select
              className="h-auto rounded-[10px] bg-[#FCFCFD] px-[12px] py-[10px] text-[13px] leading-[13px]"
              defaultValue={defaultAssigneeId}
              id="mobile-create-issue-assignee"
              name="assigneeId"
            >
              {assigneeOptions.map((option) => (
                <option key={option.value || "unassigned"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
              htmlFor="mobile-create-issue-due-date"
            >
              Due date
            </label>
            <MobileDueDateField
              defaultValue={defaultDueDate}
              id="mobile-create-issue-due-date"
              name="dueDate"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
            htmlFor="mobile-create-issue-labels"
          >
            Labels
          </label>
          <div id="mobile-create-issue-labels">
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
          <div className="flex items-center justify-between gap-3">
            <label
              className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#374151]"
              htmlFor="mobile-create-issue-description"
            >
              Description
            </label>
            <span className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[#6B7280]">
              Markdown
            </span>
          </div>

          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder="# 요약\n이슈 개요를 짧게 적어주세요..."
            minHeight="108px"
          />
          <input type="hidden" name="description" value={description} />
          <p className="text-[11px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#8A90A2]">
            /로 checklist나 code block을 추가할 수 있습니다.
          </p>
        </div>
      </form>
    </div>
  );
}
