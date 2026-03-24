import Link from "next/link";

import { Chip } from "@/components/atoms/Chip";
import { getIssuePath } from "@/features/projects/lib/paths";
import { cn } from "@/lib/utils";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
  Label,
} from "@/specs/issue-detail.contract";

const MOBILE_SECTION_ORDER: IssueStatus[] = ["Triage", "In Progress", "Done"];

const PRIORITY_CLASS_NAMES: Record<IssuePriority, string> = {
  "No Priority": "text-[var(--app-color-gray-400)]",
  Low: "text-[var(--app-color-gray-400)]",
  Medium: "text-[var(--app-color-gray-400)]",
  High: "text-[var(--app-color-ink-900)]",
  Urgent: "text-[var(--color-red-700)]",
};

function getChipVariant(label: Label) {
  const normalized = label.name.toLowerCase();

  if (normalized === "copy" || normalized === "analytics") {
    return "violet" as const;
  }

  if (normalized === "blocked") {
    return "danger" as const;
  }

  return "neutral" as const;
}

export interface MobileIssueSectionsProps {
  issues: Issue[];
  projectId: string;
  statuses?: IssueStatus[];
}

function MobileIssueCard({
  issue,
  projectId,
}: {
  issue: Issue;
  projectId: string;
}) {
  return (
    <Link
      className="flex w-full flex-col gap-[10px] rounded-[14px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-3 transition-colors hover:bg-[#F7F8FA]"
      href={getIssuePath(projectId, issue.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-500)]">
          {issue.identifier}
        </span>
        <span
          className={cn(
            "shrink-0 text-[11px] leading-[11px] font-[var(--app-font-weight-500)]",
            PRIORITY_CLASS_NAMES[issue.priority]
          )}
        >
          {issue.priority}
        </span>
      </div>

      <p className="text-[13px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-ink-900)]">
        {issue.title}
      </p>

      {issue.labels.length > 0 ? (
        <div className="flex flex-wrap gap-[6px]">
          {issue.labels.map((label) => (
            <Chip
              key={label.id}
              size="sm"
              style={
                getChipVariant(label) === "neutral" && label.color
                  ? {
                      backgroundColor: `${label.color}1A`,
                      color: label.color,
                    }
                  : undefined
              }
              variant={getChipVariant(label)}
            >
              {label.name}
            </Chip>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

export function MobileIssueSections({
  issues,
  projectId,
  statuses = MOBILE_SECTION_ORDER,
}: MobileIssueSectionsProps) {
  const sections = statuses
    .map((status) => ({
      issues: issues.filter((issue) => issue.status === status),
      status,
    }))
    .filter((section) => section.issues.length > 0);

  if (sections.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-4 py-8 text-center text-[13px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-400)]">
        No mobile issues yet
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-[14px]">
      {sections.map((section) => (
        <section className="flex w-full flex-col gap-2" key={section.status}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
              {section.status}
            </h3>
            <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-500)]">
              {section.issues.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {section.issues.map((issue) => (
              <MobileIssueCard
                issue={issue}
                key={issue.id}
                projectId={projectId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
