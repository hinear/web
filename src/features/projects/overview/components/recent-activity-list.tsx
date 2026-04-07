import Link from "next/link";

import { IssueDateMeta } from "@/features/issues/detail/components/IssueDateMeta";
import type { Issue } from "@/features/issues/types";
import { getIssuePath } from "@/features/projects/lib/project-routes";

export function RecentActivityList({
  issues,
  projectId,
}: {
  issues: Issue[];
  projectId: string;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      {issues.length > 0 ? (
        issues.map((issue) => (
          <Link
            className="rounded-[14px] border border-[#E6E8EC] bg-white px-[14px] py-[14px] transition-colors hover:bg-[#F7F8FA]"
            href={getIssuePath(projectId, issue.id, { view: "full" })}
            key={issue.id}
          >
            <p className="truncate text-[13px] leading-[1.35] font-[var(--app-font-weight-500)] text-[#111318]">
              {issue.identifier} {issue.title}
            </p>
            <p className="mt-1 text-[11px] leading-[11px] font-[var(--app-font-weight-500)] text-[#6B7280]">
              <IssueDateMeta value={issue.updatedAt} variant="relative" />
            </p>
          </Link>
        ))
      ) : (
        <div className="rounded-[14px] border border-dashed border-[#D6DAE1] bg-white px-[14px] py-[14px] text-[13px] leading-[1.4] text-[#6B7280]">
          No recent activity yet.
        </div>
      )}
    </div>
  );
}
