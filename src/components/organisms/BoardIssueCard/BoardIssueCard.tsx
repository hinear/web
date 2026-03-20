import * as React from "react";

import { Avatar } from "@/components/atoms/Avatar";
import { Chip } from "@/components/atoms/Chip";
import { cn } from "@/lib/utils";
import type {
  IssuePriority,
  Label,
  UserRef,
} from "@/specs/issue-detail.contract";

const PRIORITY_LABEL_CLASS_NAMES: Record<IssuePriority, string> = {
  "No Priority": "text-[var(--app-color-gray-400)]",
  Low: "text-[var(--app-color-gray-400)]",
  Medium: "text-[var(--color-amber-700)]",
  High: "text-[var(--color-orange-700)]",
  Urgent: "text-[var(--color-red-700)]",
};

function getChipVariant(label: Label) {
  if (label.name.toLowerCase() === "copy") {
    return "violet" as const;
  }

  if (!label.color) {
    return "neutral" as const;
  }

  return undefined;
}

export interface BoardIssueCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  assignee?: UserRef | null;
  estimate?: string;
  issueKey: string;
  issueTitle: string;
  labels?: Label[];
  priority: IssuePriority;
}

export const BoardIssueCard = React.forwardRef<
  HTMLDivElement,
  BoardIssueCardProps
>(
  (
    {
      assignee,
      className,
      estimate,
      issueKey,
      issueTitle,
      labels = [],
      priority,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "flex w-[280px] flex-col gap-[10px] rounded-[12px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-500)]">
            {issueKey}
          </span>
          <span
            className={cn(
              "text-[11px] leading-[11px] font-[var(--app-font-weight-500)]",
              PRIORITY_LABEL_CLASS_NAMES[priority]
            )}
          >
            {priority}
          </span>
        </div>

        <p className="text-[13px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-ink-900)]">
          {issueTitle}
        </p>

        {labels.length > 0 ? (
          <div className="flex flex-col gap-[6px]">
            <div className="flex flex-wrap gap-[6px]">
              {labels.map((label) => {
                const variant = getChipVariant(label);

                return (
                  <Chip
                    className={cn(
                      !variant &&
                        "border-transparent font-[var(--app-font-weight-500)]"
                    )}
                    key={label.id}
                    size="sm"
                    style={
                      !variant
                        ? {
                            backgroundColor: `${label.color}1A`,
                            color: label.color,
                          }
                        : undefined
                    }
                    variant={variant ?? "neutral"}
                  >
                    {label.name}
                  </Chip>
                );
              })}
            </div>
          </div>
        ) : null}

        {(assignee || estimate) && (
          <div className="flex items-center justify-between gap-3">
            {assignee ? (
              <div className="flex min-w-0 items-center gap-2">
                <Avatar
                  className="bg-[var(--color-teal-700)]"
                  name={assignee.name}
                  src={assignee.avatarUrl ?? null}
                />
                <span className="truncate text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
                  {assignee.name}
                </span>
              </div>
            ) : (
              <div />
            )}

            {estimate ? (
              <span className="shrink-0 text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-400)]">
                {estimate}
              </span>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

BoardIssueCard.displayName = "BoardIssueCard";
