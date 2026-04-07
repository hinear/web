"use client";

import { X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";

import { Field } from "@/components/atoms/Field";
import { Select } from "@/components/atoms/Select";
import { LabelSelector } from "@/components/molecules/LabelSelector";
import { MobileDueDateField } from "@/features/issues/create/components/mobile-due-date-field";
import { useMobileIssueCreate } from "@/features/issues/create/hooks/use-mobile-issue-create";
import { usePerformanceProfiler } from "@/features/performance/hooks/usePerformanceProfiler";
import { cn } from "@/lib/utils";

const MarkdownEditor = dynamic(
  () =>
    import("@/components/molecules/MarkdownEditor").then((module) => ({
      default: module.MarkdownEditor,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

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
  // Enable performance profiling for issue creation (1% sampling in production)
  usePerformanceProfiler(process.env.NODE_ENV === "production");

  const formId = React.useId();
  const [description, setDescription] = React.useState(defaultDescription);

  const {
    availableLabels,
    selectedLabelIds,
    labelsFormValue,
    handleLabelToggle,
    handleCreateLabel,
  } = useMobileIssueCreate({ defaultLabels, projectId });

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
          <input name="labels" readOnly type="hidden" value={labelsFormValue} />
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
          <input
            name="description"
            readOnly
            type="hidden"
            value={description}
          />
          <p className="text-[11px] leading-[1.45] font-[var(--app-font-weight-500)] text-[#8A90A2]">
            /로 checklist나 code block을 추가할 수 있습니다.
          </p>
        </div>
      </form>
    </div>
  );
}
