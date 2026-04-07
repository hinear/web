import { Settings } from "lucide-react";
import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";
import {
  getProfileSettingsPath,
  getProjectPath,
} from "@/features/projects/lib/project-routes";
import type { Project } from "@/features/projects/types";

export function ProjectOverviewMobileHeader({ project }: { project: Project }) {
  return (
    <div
      className="app-mobile-top-surface flex items-center justify-between gap-3"
      data-testid="project-overview-mobile-header"
    >
      <div className="min-w-0">
        <h1 className="truncate text-[18px] leading-[18px] font-[var(--app-font-weight-600)] text-[#111318]">
          {project.name}
        </h1>
        <p className="mt-[2px] truncate text-[12px] leading-[12px] font-[var(--app-font-weight-500)] text-[#6B7280]">
          Overview
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          className={getButtonClassName("secondary", "sm")}
          href={getProjectPath(project.id)}
        >
          Open Project
        </Link>
        <Link
          aria-label="Profile settings"
          className={getButtonClassName(
            "secondary",
            "sm",
            "app-mobile-touch-target h-[34px] w-[34px] rounded-[10px] px-0 py-0"
          )}
          href={getProfileSettingsPath()}
        >
          <Settings aria-hidden="true" className="h-[14px] w-[14px]" />
        </Link>
      </div>
    </div>
  );
}
