"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

export interface BoardProjectSwitcherProps {
  projectName: string;
  projectOptions?: Array<{
    active?: boolean;
    href?: string;
    label: string;
  }>;
}

export function BoardProjectSwitcher({
  projectName,
  projectOptions = [],
}: BoardProjectSwitcherProps) {
  return (
    <details className="group rounded-[12px] border border-[var(--app-color-border-soft)] bg-[var(--app-color-white)]">
      <summary className="flex list-none items-center justify-between gap-3 px-3 py-[10px] marker:content-none">
        <div className="min-w-0">
          <p className="text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[var(--app-color-gray-500)]">
            Project
          </p>
          <p className="mt-[2px] truncate text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
            {projectName}
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--app-color-gray-500)] transition-transform group-open:rotate-180"
        />
      </summary>

      {projectOptions.length > 0 ? (
        <div className="border-t border-[var(--app-color-border-soft)] px-2 py-2">
          <div className="flex flex-col gap-1">
            {projectOptions.map((project) =>
              project.href ? (
                <Link
                  className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                    project.active
                      ? "bg-[var(--app-color-gray-100)] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]"
                      : "font-[var(--app-font-weight-500)] text-[#4B5563]"
                  }`}
                  href={project.href}
                  key={project.href}
                >
                  {project.label}
                </Link>
              ) : (
                <div
                  className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                    project.active
                      ? "bg-[var(--app-color-gray-100)] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]"
                      : "font-[var(--app-font-weight-500)] text-[#4B5563]"
                  }`}
                  key={project.label}
                >
                  {project.label}
                </div>
              )
            )}
          </div>
        </div>
      ) : null}
    </details>
  );
}
