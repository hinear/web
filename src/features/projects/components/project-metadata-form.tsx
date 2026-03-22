import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import type { Project } from "@/features/projects/types";

interface ProjectMetadataFormProps {
  action?: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  noticeMessage?: string;
  pendingInvitationCount?: number;
  project: Project;
  teamMemberCount?: number;
}

export function ProjectMetadataForm({
  action,
  errorMessage,
  noticeMessage,
  pendingInvitationCount = 0,
  project,
  teamMemberCount = 0,
}: ProjectMetadataFormProps) {
  const hasTeamRestrictions =
    project.type === "team" &&
    (teamMemberCount > 1 || pendingInvitationCount > 0);

  return (
    <section className="rounded-[20px] border border-[var(--app-color-border-muted)] bg-white p-6">
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <h2 className="text-[18px] leading-[1.1] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
            General
          </h2>
          <p className="text-[12px] leading-5 font-[var(--app-font-weight-500)] text-[var(--app-color-gray-600)]">
            Adjust name, key, and project type. Project name can change. Project
            key and type stay read-only in the first version.
          </p>
        </div>

        {noticeMessage ? (
          <div className="rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[13px] leading-5 font-medium text-[#1D4ED8]">
            {noticeMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] leading-5 font-medium text-[#B91C1C]">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={action}
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <input
            name="pendingInvitationCount"
            type="hidden"
            value={String(pendingInvitationCount)}
          />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-semibold text-[#111318]"
                htmlFor="project-settings-name"
              >
                Project name
              </label>
              <Field
                defaultValue={project.name}
                id="project-settings-name"
                name="name"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-semibold text-[#111318]"
                htmlFor="project-settings-key"
              >
                Project key
              </label>
              <Field
                className="max-w-[180px] font-bold text-[#111318] uppercase"
                defaultValue={project.key}
                id="project-settings-key"
                name="key"
                required
                readOnly
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-3 rounded-[20px] border border-[#E6E8EC] bg-[#FAFBFD] p-4">
            <legend className="px-1 text-[13px] font-semibold text-[#111318]">
              Project type
            </legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[#D6DAE1] bg-white p-4">
              <input
                defaultChecked={project.type === "personal"}
                name="type"
                type="radio"
                value="personal"
                disabled
              />
              <span className="space-y-1">
                <span className="block text-[14px] font-semibold text-[#111318]">
                  Personal
                </span>
                <span className="block text-[12px] leading-5 font-medium text-[#6B7280]">
                  Keep the workflow lightweight for solo issue tracking.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[#D6DAE1] bg-white p-4">
              <input
                defaultChecked={project.type === "team"}
                name="type"
                type="radio"
                value="team"
                disabled
              />
              <span className="space-y-1">
                <span className="block text-[14px] font-semibold text-[#111318]">
                  Team
                </span>
                <span className="block text-[12px] leading-5 font-medium text-[#6B7280]">
                  Enable invitations, roster management, and shared ownership.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="flex items-center justify-between gap-3 border-t border-[#E6E8EC] pt-4 lg:col-span-2">
            <p className="text-[12px] leading-5 font-medium text-[#6B7280]">
              Project key changes affect future issue identifiers.
            </p>
            <Button type="submit">Save project details</Button>
          </div>
        </form>

        <section className="rounded-[20px] border border-[#FECACA] bg-[#FFF7F7] p-5">
          <div className="space-y-2">
            <h3 className="text-[16px] font-[var(--app-font-weight-700)] text-[#991B1B]">
              Danger zone
            </h3>
            <p className="text-[13px] leading-6 font-[var(--app-font-weight-500)] text-[#7F1D1D]">
              Switching a team project to personal is blocked while shared
              access is still active.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[16px] border border-[#FECACA] bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#B91C1C]">
                Other members
              </p>
              <p className="mt-2 text-[16px] font-semibold text-[#111318]">
                {Math.max(0, teamMemberCount - 1)}
              </p>
            </div>
            <div className="rounded-[16px] border border-[#FECACA] bg-white p-4">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#B91C1C]">
                Pending invites
              </p>
              <p className="mt-2 text-[16px] font-semibold text-[#111318]">
                {pendingInvitationCount}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[12px] leading-5 font-medium text-[#7F1D1D]">
            {hasTeamRestrictions
              ? "Remove every additional member and revoke all pending invitations before switching this project to personal."
              : "This project can switch to personal because no shared access remains."}
          </p>
        </section>
      </div>
    </section>
  );
}
