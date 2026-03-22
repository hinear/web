import { CreateProjectSection } from "@/components/organisms/CreateProjectSection";
import type { ProjectType } from "@/features/projects/types";

interface ProjectCreateScreenProps {
  action: (formData: FormData) => void | Promise<void>;
  defaultType?: ProjectType;
  errorMessage?: string;
}

export function ProjectCreateScreen({
  action,
  defaultType = "team",
  errorMessage,
}: ProjectCreateScreenProps) {
  return (
    <main className="min-h-screen bg-[#FCFCFD]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7 px-[40px] pt-[32px] pb-[48px]">
        <header className="flex items-center justify-between gap-4">
          <span className="font-display text-[20px] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
            Hinear
          </span>
          <span className="text-[13px] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-500)]">
            Project setup
          </span>
        </header>

        <section className="flex flex-col gap-6">
          <div className="flex w-full flex-col gap-2">
            <p className="text-[12px] font-[var(--app-font-weight-600)] text-[var(--app-color-brand-500)]">
              Project Setup
            </p>
            <h1 className="font-display text-[30px] leading-[1.05] font-[var(--app-font-weight-700)] text-[var(--app-color-ink-900)]">
              Create a new project
            </h1>
            <p className="max-w-[760px] text-[14px] leading-6 font-[var(--app-font-weight-500)] text-[#4B5563]">
              Start with a personal or team project, then land on the board and
              continue with issues, members, and settings.
            </p>
          </div>

          <CreateProjectSection
            action={action}
            defaultType={defaultType}
            errorMessage={errorMessage}
          />
        </section>
      </div>
    </main>
  );
}
