import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";

export default function InviteNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] items-center px-4 py-10">
      <section className="w-full rounded-[28px] border border-[#E6E8EC] bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5">
          <span className="w-fit rounded-full border border-[#D6DAF8] bg-[#EEF2FF] px-3 py-1 text-[12px] font-semibold text-[#4338CA]">
            Invitation
          </span>
          <div className="space-y-3">
            <h1 className="font-display text-[30px] leading-[1.05] font-bold text-[#111318] md:text-[38px]">
              This invitation link is not available.
            </h1>
            <p className="text-[15px] leading-7 font-medium text-[#4B5563]">
              The link may be invalid, expired, or already cleaned up. Ask the
              project owner to resend a fresh invitation if you still need
              access.
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
