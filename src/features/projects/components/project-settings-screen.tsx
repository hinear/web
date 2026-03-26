"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { getButtonClassName } from "@/components/atoms/Button";
import { SidebarDesktop } from "@/components/organisms/SidebarDesktop";
import { GitHubIntegrationSettingsCard } from "@/features/projects/components/github-integration-settings-card";
import { ProjectMetadataForm } from "@/features/projects/components/project-metadata-form";
import { ProjectAccessCard } from "@/features/projects/components/project-operation-cards";
import {
  getProjectOverviewPath,
  getProjectPath,
  getProjectSettingsPath,
} from "@/features/projects/lib/project-routes";
import type {
  Project,
  ProjectInvitationSummary,
  ProjectMemberSummary,
} from "@/features/projects/types";

interface ProjectSettingsScreenProps {
  detailsAction?: (formData: FormData) => void | Promise<void>;
  inviteAction?: (formData: FormData) => void | Promise<void>;
  invitationAction?: (formData: FormData) => void | Promise<void>;
  memberAction?: (formData: FormData) => void | Promise<void>;
  inviteErrorMessage?: string;
  inviteNoticeMessage?: string;
  inviteValue?: string;
  invitations?: ProjectInvitationSummary[];
  members?: ProjectMemberSummary[];
  projectErrorMessage?: string;
  projectNoticeMessage?: string;
  project: Project;
  projects?: Project[];
}

export function ProjectSettingsScreen({
  detailsAction,
  inviteAction,
  invitationAction,
  memberAction,
  inviteErrorMessage,
  inviteNoticeMessage,
  inviteValue,
  invitations,
  members,
  projectErrorMessage,
  projectNoticeMessage,
  project,
  projects,
}: ProjectSettingsScreenProps) {
  const [isDeleting, startDeletingTransition] = useTransition();

  const projectSubtitle =
    project.type === "team" ? "Team Project" : "Personal Project";

  const handleDeleteProject = () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    startDeletingTransition(async () => {
      try {
        const response = await fetch(
          `/internal/projects/${project.id}/delete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete project.");
        }

        toast.success("Project deleted successfully.");

        // Redirect to projects list after a short delay
        setTimeout(() => {
          window.location.href = "/projects";
        }, 500);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete project."
        );
      }
    });
  };

  return (
    <main className="min-h-screen bg-[var(--app-color-surface-0)] md:flex">
      <div className="hidden md:flex md:self-stretch">
        <SidebarDesktop
          defaultProjects={(projects ?? []).map((entry) => ({
            active: entry.id === project.id,
            href: getProjectPath(entry.id),
            label: entry.name,
          }))}
          dashboardHref={getProjectOverviewPath(project.id)}
          dashboardLabel="Overview"
          navigationHrefs={{
            issues: getProjectPath(project.id),
          }}
          projectSubtitle={projectSubtitle}
          projectTitle={project.name}
          settingsActive
          settingsHref={getProjectSettingsPath(project.id)}
        />
      </div>

      <div className="min-w-0 flex flex-1 flex-col self-stretch">
        <div className="flex min-h-screen w-full flex-1 flex-col gap-6 bg-[#FCFCFD] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 md:hidden">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--app-color-brand-500)]" />
              <span className="text-[16px] font-[var(--app-font-weight-600)] text-[var(--app-color-ink-900)]">
                Hinear
              </span>
            </div>
            <Link className={getButtonClassName("ghost")} href="/">
              Back to home
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
            <section className="flex flex-col gap-2">
              <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#5E6AD2]">
                Project Settings
              </p>
              <h1 className="font-display text-[30px] leading-[1.1] font-[var(--app-font-weight-700)] text-[#111318]">
                {project.name} project settings
              </h1>
              <p className="max-w-[640px] text-[14px] leading-6 font-[var(--app-font-weight-500)] text-[#4B5563]">
                Keep project identity, access, and destructive actions in one
                predictable place.
              </p>
            </section>

            <div className="flex flex-col gap-6 xl:flex-row">
              <aside className="w-full shrink-0 rounded-[20px] border border-[#E6E8EC] bg-white p-4 xl:w-[240px]">
                <div className="flex flex-col gap-1">
                  {["General", "Access", "Members", "Danger zone"].map(
                    (item) => (
                      <button
                        className={[
                          "rounded-[12px] px-3 py-[10px] text-left text-[13px] font-[var(--app-font-weight-500)]",
                          item === "General"
                            ? "bg-[#F5F7FF] text-[#111318]"
                            : "text-[#6B7280]",
                        ].join(" ")}
                        key={item}
                        type="button"
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              </aside>

              <section className="flex min-w-0 flex-1 flex-col gap-5 rounded-[24px] border border-[#E6E8EC] bg-white p-6">
                <ProjectMetadataForm
                  action={detailsAction}
                  errorMessage={projectErrorMessage}
                  noticeMessage={projectNoticeMessage}
                  pendingInvitationCount={invitations?.length ?? 0}
                  project={project}
                  teamMemberCount={members?.length ?? 0}
                />

                <ProjectAccessCard
                  action={inviteAction}
                  errorMessage={inviteErrorMessage}
                  invitationAction={invitationAction}
                  inviteValue={inviteValue}
                  invitations={invitations}
                  memberAction={memberAction}
                  members={members}
                  noticeMessage={inviteNoticeMessage}
                  projectType={project.type}
                />
                <GitHubIntegrationSettingsCard projectId={project.id} />

                <div className="rounded-[20px] border border-red-200 bg-red-50 p-6">
                  <h2 className="text-[18px] font-bold text-red-900">
                    Danger Zone
                  </h2>
                  <p className="mt-2 text-[13px] font-medium text-red-700">
                    Once you delete a project, there is no going back. Please be
                    certain.
                  </p>
                  <button
                    className="mt-4 rounded-[10px] bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isDeleting}
                    onClick={handleDeleteProject}
                    type="button"
                  >
                    {isDeleting ? "Deleting..." : "Delete this project"}
                  </button>
                </div>

                <div className="flex justify-end">
                  <Link
                    className={getButtonClassName("ghost")}
                    href={getProjectOverviewPath(project.id)}
                  >
                    Overview
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
