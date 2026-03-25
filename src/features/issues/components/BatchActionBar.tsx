"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/atoms/Select/Select";
import { batchUpdateIssuesAction } from "@/features/issues/actions/batch-update-issues-action";
import type { IssuePriority, IssueStatus } from "@/features/issues/types";

interface BatchActionBarProps {
  assigneeOptions: Array<{ label: string; value: string }>;
  projectId: string;
  selectedCount: number;
  selectedIssueIds: string[];
  onClearSelection: () => void;
}

const ISSUE_STATUSES: IssueStatus[] = [
  "Triage",
  "Backlog",
  "Todo",
  "In Progress",
  "Done",
  "Canceled",
];

const ISSUE_PRIORITIES: IssuePriority[] = [
  "No Priority",
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export function BatchActionBar({
  assigneeOptions,
  projectId,
  selectedCount,
  selectedIssueIds,
  onClearSelection,
}: BatchActionBarProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBatchStatusChange = async (status: IssueStatus) => {
    setIsUpdating(true);
    try {
      const result = await batchUpdateIssuesAction({
        projectId,
        updates: selectedIssueIds.map((issueId) => ({
          issueId,
          status,
          version: 1, // Note: This should be the actual version from the issue
        })),
      });

      if (!result.success) {
        toast.error(
          `Failed to update ${selectedCount} issue${selectedCount > 1 ? "s" : ""}`
        );
        console.error(result.errors);
        return;
      }

      toast.success(
        `Updated ${result.updated.filter((u) => u.success).length} issue${selectedCount > 1 ? "s" : ""} to "${status}"`
      );
      onClearSelection();
    } catch (error) {
      toast.error("Failed to update issues");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBatchAssigneeChange = async (assigneeId: string) => {
    setIsUpdating(true);
    try {
      const result = await batchUpdateIssuesAction({
        projectId,
        updates: selectedIssueIds.map((issueId) => ({
          issueId,
          assigneeId: assigneeId || null,
          version: 1,
        })),
      });

      if (!result.success) {
        toast.error(`Failed to update assignees`);
        console.error(result.errors);
        return;
      }

      toast.success(
        `Assigned ${result.updated.filter((u) => u.success).length} issue${selectedCount > 1 ? "s" : ""}`
      );
      onClearSelection();
    } catch (error) {
      toast.error("Failed to update assignees");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBatchPriorityChange = async (priority: IssuePriority) => {
    setIsUpdating(true);
    try {
      const result = await batchUpdateIssuesAction({
        projectId,
        updates: selectedIssueIds.map((issueId) => ({
          issueId,
          priority,
          version: 1,
        })),
      });

      if (!result.success) {
        toast.error(`Failed to update priorities`);
        console.error(result.errors);
        return;
      }

      toast.success(
        `Updated ${result.updated.filter((u) => u.success).length} issue${selectedCount > 1 ? "s" : ""} to "${priority}"`
      );
      onClearSelection();
    } catch (error) {
      toast.error("Failed to update priorities");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--app-color-border-soft)] bg-[#6366F1] px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Selected count and clear */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            {selectedCount} issue{selectedCount > 1 ? "s" : ""} selected
          </span>
          <button
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClearSelection}
            disabled={isUpdating}
            type="button"
          >
            Clear
          </button>
        </div>

        {/* Right: Batch actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">Set status:</span>
            <Select
              defaultValue=""
              disabled={isUpdating}
              onValueChange={(value) => {
                if (value) {
                  handleBatchStatusChange(value as IssueStatus);
                }
              }}
              value=""
            >
              <option disabled value="" key="status-placeholder">
                Status
              </option>
              {ISSUE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">Assign:</span>
            <Select
              defaultValue=""
              disabled={isUpdating}
              onValueChange={(value) => {
                if (value !== undefined) {
                  handleBatchAssigneeChange(value);
                }
              }}
              value=""
            >
              <option disabled value="" key="assignee-placeholder">
                Assignee
              </option>
              {assigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">Priority:</span>
            <Select
              defaultValue=""
              disabled={isUpdating}
              onValueChange={(value) => {
                if (value) {
                  handleBatchPriorityChange(value as IssuePriority);
                }
              }}
              value=""
            >
              <option disabled value="" key="priority-placeholder">
                Priority
              </option>
              {ISSUE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
