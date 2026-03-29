import Link from "next/link";

import { getButtonClassName } from "@/components/atoms/Button";
import { NotificationSettingsCard } from "@/features/notifications/components/NotificationSettingsCard";

interface ProfileSettingsScreenProps {
  accountId: string;
  displayName: string;
  email: string;
  logoutAction: () => Promise<void>;
}

export function ProfileSettingsScreen({
  accountId,
  displayName,
  email,
  logoutAction,
}: ProfileSettingsScreenProps) {
  return (
    <main className="min-h-screen bg-[#FCFCFD]">
      <div
        className="app-mobile-page-shell mx-auto flex min-h-screen w-full max-w-[960px] flex-col gap-6 px-4 py-8 md:px-6"
        data-testid="profile-settings-shell"
      >
        <div className="app-mobile-top-surface flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[12px] leading-[12px] font-[var(--app-font-weight-600)] text-[#5E6AD2]">
              Profile Settings
            </p>
            <h1 className="font-display text-[30px] leading-[1.1] font-[var(--app-font-weight-700)] text-[#111318]">
              Your profile
            </h1>
            <p className="max-w-[560px] text-[14px] leading-6 font-[var(--app-font-weight-500)] text-[#4B5563]">
              Manage your account details, personal notifications, and sign-out
              access from one place.
            </p>
          </div>

          <Link
            className={getButtonClassName("secondary")}
            href="/projects/overview"
          >
            Back to overview
          </Link>
        </div>

        <section className="rounded-[24px] border border-[#E6E8EC] bg-white p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-bold text-[#111318]">Account</h2>
              <p className="text-[13px] leading-6 text-[#6B7280]">
                This information comes from your current authenticated profile.
              </p>
            </div>

            <dl className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4">
                <dt className="text-[12px] font-semibold text-[#6B7280]">
                  Display name
                </dt>
                <dd className="mt-2 text-[15px] font-semibold text-[#111318]">
                  {displayName}
                </dd>
              </div>
              <div className="rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4">
                <dt className="text-[12px] font-semibold text-[#6B7280]">
                  Email
                </dt>
                <dd className="mt-2 text-[15px] font-semibold text-[#111318]">
                  {email}
                </dd>
              </div>
              <div className="rounded-[16px] border border-[#E6E8EC] bg-[#FCFCFD] p-4 md:col-span-2">
                <dt className="text-[12px] font-semibold text-[#6B7280]">
                  Account ID
                </dt>
                <dd className="mt-2 break-all text-[13px] font-medium text-[#111318]">
                  {accountId}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <NotificationSettingsCard />

        <section className="rounded-[24px] border border-[#FECACA] bg-[#FEF2F2] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-bold text-[#991B1B]">Session</h2>
              <p className="max-w-[560px] text-[13px] leading-6 font-medium text-[#B91C1C]">
                Sign out on this device when you are done, especially on shared
                or temporary machines.
              </p>
            </div>

            <form action={logoutAction}>
              <button
                className={getButtonClassName(
                  "secondary",
                  "md",
                  "border-[#FCA5A5] bg-white text-[#991B1B] hover:bg-[#FEE2E2]"
                )}
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
