import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";

export default function ProjectSettingsNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[880px] items-center px-4 py-10">
      <section className="w-full rounded-[28px] border border-[var(--app-color-border-muted)] bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-9">
        <div className="flex flex-col gap-5">
          <span className="w-fit rounded-full border border-[#D6DAF8] bg-[#EEF2FF] px-3 py-1 text-[12px] font-semibold text-[#4338CA]">
            Project settings
          </span>
          <div className="space-y-3">
            <h1 className="font-display text-[30px] leading-[1.05] font-bold text-[#111318] md:text-[38px]">
              This project settings page is not available.
            </h1>
            <p className="max-w-[640px] text-[15px] leading-7 font-medium text-[#4B5563]">
              The project may have been removed or your access may have changed.
              Return to the project list or create a new workspace to continue.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className={getButtonClassName("primary")}
              href="/projects/new"
            >
              Create project
            </Link>
            <Link className={getButtonClassName("secondary")} href="/">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
