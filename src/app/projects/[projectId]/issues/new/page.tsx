import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";
import { CreateIssueTabletModal } from "@/components/organisms/CreateIssueTabletModal";
import { createIssueAction } from "@/features/issues/actions/create-issue-action";
import { MobileIssueCreateScreen } from "@/features/issues/components/mobile-issue-create-screen";
import { loadProjectWorkspace } from "@/features/projects/lib/load-project-workspace";
import {
  getProjectIssueCreatePath,
  getProjectPath,
  getProjectSettingsPath,
} from "@/features/projects/lib/project-routes";

interface NewProjectIssuePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function NewProjectIssuePage({
  params,
}: NewProjectIssuePageProps) {
  const { projectId } = await params;
  const { members, project } = await loadProjectWorkspace(
    projectId,
    getProjectIssueCreatePath(projectId)
  );

  const assigneeOptions = [
    { label: "Assign to...", value: "" },
    ...members.map((member) => ({
      label: member.name,
      value: member.id,
    })),
  ];

  return (
    <main className="min-h-screen bg-[#FCFCFD]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-4 md:px-6 md:py-8">
        <div className="md:hidden">
          <MobileIssueCreateScreen
            action={createIssueAction.bind(null, projectId)}
            assigneeOptions={assigneeOptions}
            cancelHref={getProjectPath(projectId)}
          />
        </div>

        <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-500)]">
              {project.name} / New issue
            </p>
            <h1 className="font-display text-[24px] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
              Create issue
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={getButtonClassName("secondary")}
              href={getProjectPath(projectId)}
            >
              Back to board
            </Link>
            <Link
              className={getButtonClassName("ghost")}
              href={getProjectSettingsPath(projectId)}
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="hidden justify-center md:flex">
          <CreateIssueTabletModal
            action={createIssueAction.bind(null, projectId)}
            assigneeOptions={assigneeOptions}
            className="w-full max-w-[720px]"
          />
        </div>
      </div>
    </main>
  );
}
