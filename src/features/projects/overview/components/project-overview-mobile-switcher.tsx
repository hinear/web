import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { getProjectOverviewPath } from "@/features/projects/lib/project-routes";
import type { Project } from "@/features/projects/types";

export function ProjectOverviewMobileSwitcher({
  project,
  projects,
}: {
  project: Project;
  projects: Project[];
}) {
  return (
    <details className="group rounded-[12px] border border-[#E6E8EC] bg-white">
      <summary className="flex list-none items-center justify-between gap-3 px-3 py-[10px] marker:content-none">
        <div className="min-w-0">
          <p className="text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[#6B7280]">
            Project
          </p>
          <p className="mt-[2px] truncate text-[13px] leading-[13px] font-[var(--app-font-weight-600)] text-[#111318]">
            {project.name}
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[#6B7280] transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-[#E6E8EC] px-2 py-2">
        <div className="flex flex-col gap-1">
          {projects.map((candidate) => (
            <Link
              className={`rounded-[10px] px-[10px] py-[9px] text-[13px] leading-[13px] ${
                candidate.id === project.id
                  ? "bg-[#F3F4F6] font-[var(--app-font-weight-600)] text-[#111318]"
                  : "font-[var(--app-font-weight-500)] text-[#4B5563]"
              }`}
              href={getProjectOverviewPath(candidate.id)}
              key={candidate.id}
            >
              {candidate.name}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
