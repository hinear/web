import { ChevronDown } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Chip } from "@/components/atoms/Chip";
import { cn } from "@/lib/utils";
import type {
  ActivityLogEntry,
  Issue,
  IssuePriority,
} from "@/specs/issue-detail.contract";

const PRIORITY_CLASS_NAMES: Record<IssuePriority, string> = {
  "No Priority": "text-[var(--app-color-gray-500)]",
  Low: "text-[var(--app-color-gray-500)]",
  Medium: "text-[var(--color-amber-700)]",
  High: "text-[var(--color-red-700)]",
  Urgent: "text-[var(--color-red-700)]",
};

interface DrawerIssueDetailPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  activityLog?: ActivityLogEntry[];
  closeHref?: string;
  createdByName?: string;
  issue: Issue;
  lastEditedByName?: string;
  modeLabel?: string;
  onClose?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onOpenFullPage?: React.ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  openFullPageHref?: string;
}

function formatRelativeTime(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function splitDescription(description: string) {
  const trimmed = description.trim();

  if (!trimmed) {
    return {
      bullets: [],
      intro: "No compact description yet.",
    };
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const intro = lines.find((line) => !line.startsWith("- ")) ?? lines[0] ?? "";
  const bullets = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^- /, ""));

  return { bullets, intro };
}

function getLabelVariant(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("blocked")) {
    return "danger" as const;
  }

  if (
    normalized.includes("auth") ||
    normalized.includes("copy") ||
    normalized.includes("analytics")
  ) {
    return "violet" as const;
  }

  return "neutral" as const;
}

function CompactField({
  label,
  toneClassName,
  value,
}: {
  label: string;
  toneClassName?: string;
  value: string;
}) {
  return (
    <div className="flex w-full flex-col gap-[6px]">
      <span className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-500)]">
        {label}
      </span>
      <div className="flex w-full items-center justify-between rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-3 py-[9px]">
        <span
          className={cn(
            "text-[13px] leading-[13px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-700)]",
            toneClassName
          )}
        >
          {value}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="h-[14px] w-[14px] text-[var(--app-color-gray-500)]"
        />
      </div>
    </div>
  );
}

function PanelCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-[10px] rounded-[16px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-4",
        className
      )}
    >
      {children}
    </section>
  );
}

export const DrawerIssueDetailPanel = React.forwardRef<
  HTMLDivElement,
  DrawerIssueDetailPanelProps
>(
  (
    {
      activityLog = [],
      className,
      closeHref,
      createdByName,
      issue,
      lastEditedByName,
      modeLabel = "Inline edit",
      onClose,
      onOpenFullPage,
      openFullPageHref,
      ...props
    },
    ref
  ) => {
    const { bullets, intro } = splitDescription(issue.description);
    const visibleLabels = issue.labels.slice(0, 2);
    const hiddenLabelCount = Math.max(
      issue.labels.length - visibleLabels.length,
      0
    );
    const recentActivity = activityLog.slice(0, 2);

    return (
      <aside
        className={cn(
          "flex h-[936px] w-[688px] flex-col gap-4 overflow-hidden rounded-[20px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] p-5 shadow-[-12px_20px_40px_rgba(15,23,42,0.12)]",
          className
        )}
        ref={ref}
        {...props}
      >
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] leading-[20px] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
              Issue Detail / Drawer
            </h2>
            <p className="mt-1 text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
              Compact fields first. Shared detail rules with the full page
              route.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {openFullPageHref ? (
              <Link
                className="rounded-[10px] bg-[var(--app-color-brand-50)] px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                href={openFullPageHref}
              >
                Open full page
              </Link>
            ) : (
              <button
                className="rounded-[10px] bg-[var(--app-color-brand-50)] px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                onClick={onOpenFullPage}
                type="button"
              >
                Open full page
              </button>
            )}
            {closeHref ? (
              <Link
                className="rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-700)]"
                href={closeHref}
              >
                Close
              </Link>
            ) : (
              <button
                className="rounded-[10px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)] px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-700)]"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            )}
          </div>
        </header>

        <div className="rounded-[12px] border border-[var(--app-color-brand-200)] bg-[var(--app-color-brand-50)] px-[14px] py-3">
          <p className="text-[12px] leading-[1.45] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-700)]">
            Same detail model as the full page. Drawer intentionally shows only
            compact fields and recent activity; open full page for full history
            and metadata.
          </p>
        </div>

        <div className="flex h-[620px] flex-col gap-4 overflow-y-auto pr-1">
          <PanelCard className="gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-500)]">
                    {issue.identifier}
                  </span>
                  <span className="text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-500)]">
                    {modeLabel}
                  </span>
                </div>
                <h3 className="mt-[6px] text-[22px] leading-[1.2] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
                  {issue.title}
                </h3>
                <p className="mt-[6px] text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-600)]">
                  {intro}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              <CompactField label="Status" value={issue.status} />
              <CompactField
                label="Priority"
                toneClassName={PRIORITY_CLASS_NAMES[issue.priority]}
                value={issue.priority}
              />
              <CompactField
                label="Assignee"
                value={issue.assignee?.name ?? "Unassigned"}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-[6px]">
                {visibleLabels.map((label) => (
                  <Chip
                    key={label.id}
                    size="sm"
                    variant={getLabelVariant(label.name)}
                  >
                    {label.name}
                  </Chip>
                ))}
              </div>
              {hiddenLabelCount > 0 ? (
                <span className="shrink-0 text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-500)]">
                  +{hiddenLabelCount} more
                </span>
              ) : null}
            </div>
          </PanelCard>

          <PanelCard>
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[14px] leading-[14px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                Short description
              </h4>
              <span className="rounded-full bg-[var(--app-color-gray-100)] px-[10px] py-[6px] text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-500)]">
                Compact
              </span>
            </div>

            <div className="rounded-[12px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-surface-0)] px-[14px] py-3">
              <p className="text-[13px] leading-[1.5] font-[var(--app-font-weight-500)] text-[var(--app-color-ink-900)]">
                {intro}
              </p>
              {bullets.length > 0 ? (
                <div className="mt-2 whitespace-pre-line text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-600)]">
                  {bullets.map((bullet) => `- ${bullet}`).join("\n")}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
                Long-form editing moves to full page.
              </span>
              {openFullPageHref ? (
                <Link
                  className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                  href={openFullPageHref}
                >
                  Open full page
                </Link>
              ) : (
                <button
                  className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                  onClick={onOpenFullPage}
                  type="button"
                >
                  Open full page
                </button>
              )}
            </div>
          </PanelCard>

          <PanelCard>
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[14px] leading-[14px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                Recent activity
              </h4>
              {openFullPageHref ? (
                <Link
                  className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                  href={openFullPageHref}
                >
                  View full history
                </Link>
              ) : (
                <button
                  className="text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                  onClick={onOpenFullPage}
                  type="button"
                >
                  View full history
                </button>
              )}
            </div>

            <p className="text-[11px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
              Latest events only. Full timeline stays on the full page route.
            </p>

            <div className="flex flex-col gap-2">
              {recentActivity.length > 0 ? (
                recentActivity.map((entry) => (
                  <div
                    className="rounded-[12px] bg-[var(--app-color-surface-0)] px-[14px] py-3"
                    key={entry.id}
                  >
                    <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                      {entry.actor.name} · {formatRelativeTime(entry.createdAt)}
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-600)]">
                      {entry.summary}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] bg-[var(--app-color-surface-0)] px-[14px] py-3 text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
                  No recent activity.
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard>
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[14px] leading-[14px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                Metadata summary
              </h4>
              <span className="rounded-full bg-[var(--app-color-gray-100)] px-[10px] py-[6px] text-[11px] leading-[11px] font-[var(--app-font-weight-600)] text-[var(--app-color-gray-500)]">
                Compact
              </span>
            </div>

            <p className="whitespace-pre-line text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-600)]">
              {[
                `Created ${formatCompactDate(issue.createdAt)} · Updated ${formatRelativeTime(issue.updatedAt)}`,
                createdByName || lastEditedByName
                  ? `Author ${createdByName ?? "Unknown"} · Last editor ${lastEditedByName ?? createdByName ?? "Unknown"}`
                  : null,
              ]
                .filter(Boolean)
                .join("\n")}
            </p>

            {openFullPageHref ? (
              <Link
                className="w-fit text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                href={openFullPageHref}
              >
                Open full page for full metadata
              </Link>
            ) : (
              <button
                className="w-fit text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-brand-700)]"
                onClick={onOpenFullPage}
                type="button"
              >
                Open full page for full metadata
              </button>
            )}
          </PanelCard>
        </div>

        <footer className="flex items-center justify-between gap-4">
          <p className="text-[12px] leading-[1.45] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
            Scroll inside this drawer for more. Full page remains the source of
            truth.
          </p>
          {openFullPageHref ? (
            <Link
              className="shrink-0 rounded-[10px] bg-[var(--app-color-brand-500)] px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-white)]"
              href={openFullPageHref}
            >
              Open full page
            </Link>
          ) : (
            <button
              className="shrink-0 rounded-[10px] bg-[var(--app-color-brand-500)] px-3 py-[9px] text-[12px] leading-[12px] font-[var(--app-font-weight-700)] text-[var(--app-color-white)]"
              onClick={onOpenFullPage}
              type="button"
            >
              Open full page
            </button>
          )}
        </footer>
      </aside>
    );
  }
);

DrawerIssueDetailPanel.displayName = "DrawerIssueDetailPanel";
